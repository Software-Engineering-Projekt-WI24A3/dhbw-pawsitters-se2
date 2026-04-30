package com.pawsitters.model;

public enum PetChoice {
    DOG("dog"),
    CAT("cat"),
    RABBIT("rabbit"),
    HAMSTER("hamster"),
    GUINEA_PIG("guinea_pig"),
    PARROT("parrot"),
    BUDGIE("budgie"),
    CANARY("canary"),
    TURTLE("turtle"),
    SNAKE("snake"),
    LIZARD("lizard"),
    FERRET("ferret"),
    RAT("rat"),
    MOUSE("mouse"),
    FISH("fish"),
    HORSE("horse"),
    DONKEY("donkey"),
    GOAT("goat"),
    CHICKEN("chicken"),
    BIRD("bird");

    private final String folderName;

    PetChoice(String folderName) {
        this.folderName = folderName;
    }

    /**
     * Gibt den Ordnernamen für das tierspezifische Fallback-Bild zurück.
     * Format: /images/pet_images/{folderName}/
     */
    public String getFallbackImagePath() {
        return "/images/pet_images/" + this.folderName + "/";
    }
}
