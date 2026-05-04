package com.unigate.registration.enums;

public enum RegistrationType {
    FIRST_YEAR_ING, SECOND_YEAR_ING, THIRD_YEAR_ING,
    MASTER_M1, MASTER_M2, DOUBLE_DIPLOMA, EXCHANGE_PROGRAM;

    public boolean isSelectiveType() {
        return this == MASTER_M1 || this == MASTER_M2
                || this == DOUBLE_DIPLOMA || this == EXCHANGE_PROGRAM;
    }
}
