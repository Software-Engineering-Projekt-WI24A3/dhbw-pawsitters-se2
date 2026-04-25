package com.pawsitters;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Haupteinstiegspunkt der Pawsitters-Anwendung.
 *
 * Diese Klasse startet die Spring Boot Anwendung und initialisiert
 * alle notwendigen Komponenten.
 */
@SpringBootApplication
@EnableScheduling
public class PawsittersApplication {

	public static void main(String[] args) {
		SpringApplication.run(PawsittersApplication.class, args);
	}

}

