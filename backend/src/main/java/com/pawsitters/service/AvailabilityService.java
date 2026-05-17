package com.pawsitters.service;

import com.pawsitters.dto.AvailabilityResponse;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.HostAvailability;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.HostAvailabilityRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

@Service
public class AvailabilityService {

    private static final long MAX_RECURRING_RANGE_DAYS = 1095;

    private final HostAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    public AvailabilityService(HostAvailabilityRepository availabilityRepository,
                               UserRepository userRepository) {
        this.availabilityRepository = availabilityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> getAvailabilityForHostEmail(String hostEmail) {
        User host = getHostByEmail(hostEmail);
        return availabilityRepository.findByHostIdOrderByStartDateAscIdAsc(host.getId()).stream()
                .map(AvailabilityResponse::from)
                .toList();
    }

    @Transactional
    public AvailabilityResponse createSingleAvailability(String hostEmail,
                                                         LocalDate startDate,
                                                         LocalDate endDate) {
        User host = getHostByEmail(hostEmail);
        validateDateRange(startDate, endDate);
        assertNoSingleOverlap(host, startDate, endDate);

        HostAvailability availability = new HostAvailability();
        availability.setHost(host);
        availability.setStartDate(startDate);
        availability.setEndDate(endDate);
        availability.setRecurring(false);
        availability.setDaysOfWeek(Set.of());

        return AvailabilityResponse.from(availabilityRepository.save(availability));
    }

    @Transactional
    public AvailabilityResponse createRecurringAvailability(String hostEmail,
                                                            LocalDate startDate,
                                                            LocalDate endDate,
                                                            Set<DayOfWeek> daysOfWeek) {
        User host = getHostByEmail(hostEmail);
        validateDateRange(startDate, endDate);
        validateRecurringRange(startDate, endDate);
        Set<DayOfWeek> normalizedDays = normalizeDaysOfWeek(daysOfWeek);
        if (normalizedDays.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bitte waehle mindestens einen Wochentag aus.");
        }

        List<LocalDate> occurrenceDates = collectRecurringOccurrenceDates(startDate, endDate, normalizedDays);
        if (occurrenceDates.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der wiederkehrende Zeitraum enthaelt keinen passenden Wochentag."
            );
        }

        assertNoRecurringOverlap(host, startDate, endDate, occurrenceDates);

        HostAvailability availability = new HostAvailability();
        availability.setHost(host);
        availability.setStartDate(startDate);
        availability.setEndDate(endDate);
        availability.setRecurring(true);
        availability.setDaysOfWeek(normalizedDays);

        return AvailabilityResponse.from(availabilityRepository.save(availability));
    }

    @Transactional
    public void deleteAvailability(String hostEmail, Long availabilityId) {
        HostAvailability availability = availabilityRepository.findByIdAndHostEmail(availabilityId, hostEmail)
                .orElseThrow(() -> new NotFoundException("Verfuegbarkeit nicht gefunden."));
        availabilityRepository.delete(availability);
    }

    @Transactional(readOnly = true)
    public void assertHostAvailableForRange(User host, LocalDate startDate, LocalDate endDate) {
        if (host == null || host.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gastgeber nicht gefunden.");
        }
        validateDateRange(startDate, endDate);

        List<HostAvailability> availabilityEntries = availabilityRepository.findByHostIdOrderByStartDateAscIdAsc(host.getId());
        if (availabilityEntries.isEmpty()) {
            return;
        }

        LocalDate cursor = startDate;
        while (!cursor.isAfter(endDate)) {
            LocalDate dateToCheck = cursor;
            boolean covered = availabilityEntries.stream()
                    .anyMatch(availability -> coversDate(availability, dateToCheck));
            if (!covered) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Der Gastgeber ist am " + dateToCheck + " nicht verfuegbar. Du kannst diesen Zeitraum dort nicht buchen."
                );
            }
            cursor = cursor.plusDays(1);
        }
    }

    private void assertNoSingleOverlap(User host, LocalDate startDate, LocalDate endDate) {
        List<HostAvailability> existingEntries = availabilityRepository.findByHostIdOrderByStartDateAscIdAsc(host.getId());
        for (HostAvailability existing : existingEntries) {
            if (!intervalsOverlap(existing.getStartDate(), existing.getEndDate(), startDate, endDate)) {
                continue;
            }
            if (!existing.isRecurring()) {
                throw availabilityOverlapException(existing);
            }

            LocalDate cursor = startDate;
            while (!cursor.isAfter(endDate)) {
                if (coversDate(existing, cursor)) {
                    throw availabilityOverlapException(existing);
                }
                cursor = cursor.plusDays(1);
            }
        }
    }

    private void assertNoRecurringOverlap(User host,
                                          LocalDate startDate,
                                          LocalDate endDate,
                                          List<LocalDate> occurrenceDates) {
        List<HostAvailability> existingEntries = availabilityRepository.findByHostIdOrderByStartDateAscIdAsc(host.getId());
        for (HostAvailability existing : existingEntries) {
            if (!intervalsOverlap(existing.getStartDate(), existing.getEndDate(), startDate, endDate)) {
                continue;
            }

            for (LocalDate occurrenceDate : occurrenceDates) {
                if (coversDate(existing, occurrenceDate)) {
                    throw availabilityOverlapException(existing);
                }
            }
        }
    }

    private ResponseStatusException availabilityOverlapException(HostAvailability existing) {
        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Dieser Zeitraum ueberschneidet sich mit einer vorhandenen Verfuegbarkeit (ID "
                        + existing.getId() + ")."
        );
    }

    private boolean coversDate(HostAvailability availability, LocalDate date) {
        if (availability == null || date == null) {
            return false;
        }
        if (date.isBefore(availability.getStartDate()) || date.isAfter(availability.getEndDate())) {
            return false;
        }
        if (!availability.isRecurring()) {
            return true;
        }
        return availability.getDaysOfWeek().contains(date.getDayOfWeek());
    }

    private boolean intervalsOverlap(LocalDate leftStart, LocalDate leftEnd, LocalDate rightStart, LocalDate rightEnd) {
        return !leftEnd.isBefore(rightStart) && !rightEnd.isBefore(leftStart);
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bitte gib einen gueltigen Zeitraum an.");
        }
        if (endDate.isBefore(startDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Der Zeitraum ist ungueltig: Enddatum liegt vor dem Startdatum."
            );
        }
    }

    private void validateRecurringRange(LocalDate startDate, LocalDate endDate) {
        long rangeDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (rangeDays > MAX_RECURRING_RANGE_DAYS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Wiederkehrende Verfuegbarkeiten duerfen hoechstens drei Jahre umfassen."
            );
        }
    }

    private Set<DayOfWeek> normalizeDaysOfWeek(Set<DayOfWeek> daysOfWeek) {
        if (daysOfWeek == null || daysOfWeek.isEmpty()) {
            return Set.of();
        }

        TreeSet<DayOfWeek> sortedDays = new TreeSet<>(Comparator.naturalOrder());
        sortedDays.addAll(daysOfWeek);
        return new LinkedHashSet<>(sortedDays);
    }

    private List<LocalDate> collectRecurringOccurrenceDates(LocalDate startDate,
                                                            LocalDate endDate,
                                                            Set<DayOfWeek> daysOfWeek) {
        return startDate.datesUntil(endDate.plusDays(1))
                .filter(date -> daysOfWeek.contains(date.getDayOfWeek()))
                .toList();
    }

    private User getHostByEmail(String hostEmail) {
        User user = userRepository.findByEmailIgnoreCase(hostEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User nicht gefunden."));
        if (user.getRole() != UserRole.HOST) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Nur Gastgeber koennen Verfuegbarkeiten verwalten.");
        }
        return user;
    }
}
