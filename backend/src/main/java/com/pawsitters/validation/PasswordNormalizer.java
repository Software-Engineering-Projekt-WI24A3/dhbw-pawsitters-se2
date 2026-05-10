package com.pawsitters.validation;

import java.text.Normalizer;

public final class PasswordNormalizer {

    private PasswordNormalizer() {
    }

    public static String normalize(String password) {
        return password == null ? null : Normalizer.normalize(password, Normalizer.Form.NFC);
    }
}
