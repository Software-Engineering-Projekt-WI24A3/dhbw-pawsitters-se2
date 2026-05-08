package com.pawsitters.dto;

import java.time.Instant;

public record ApiMeta(
        Instant timestamp,
        String path,
        Integer total
) {
    public static ApiMeta of(String path) {
        return new ApiMeta(Instant.now(), path, null);
    }

    public static ApiMeta of(String path, Integer total) {
        return new ApiMeta(Instant.now(), path, total);
    }
}
