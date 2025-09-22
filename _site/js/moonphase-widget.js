console.log("Moonphase widget has loaded");

function getAccurateMoonAge(date) {
    // The Julian Day number for the given date.
    // This is a continuous count of days since noon Universal Time on January 1, 4713 B.C.
    const jd = date.getTime() / 86400000 - date.getTimezoneOffset() / 1440 + 2440587.5;

    // The Julian date of the first new moon of the year 2000
    // This is a well-established astronomical constant.
    const newMoon2000 = 2451550.09766;

    // The average length of a lunar cycle (synodic period)
    const synodicPeriod = 29.53058867;

    // Calculate the number of lunar cycles since the known new moon
    const lunarCycles = (jd - newMoon2000) / synodicPeriod;

    // The fractional part of the lunar cycles represents the current lunar age
    // We get the fraction by subtracting the integer part
    const fractionalPart = lunarCycles - Math.floor(lunarCycles);

    // Convert the fractional age back into days
    let lunarAgeInDays = fractionalPart * synodicPeriod;

    // Correct for the last new moon of the previous year
    // This handles cases where the calculated age is negative
    if (lunarAgeInDays < 0) {
        lunarAgeInDays += synodicPeriod;
    }

    return lunarAgeInDays;
}

function getMoonPhaseName(lunarAge) {
    if (lunarAge < 1.84) return 'New Moon';
    if (lunarAge < 5.51) return 'Waxing Crescent';
    if (lunarAge < 9.18) return 'First Quarter';
    if (lunarAge < 12.84) return 'Waxing Gibbous';
    if (lunarAge < 16.51) return 'Full Moon';
    if (lunarAge < 20.18) return 'Waning Gibbous';
    if (lunarAge < 22.1) return 'Last Quarter';
    if (lunarAge < 27.51) return 'Waning Crescent';
    return 'New Moon';
}

function moonPhaseWidget() {
    const lunarAge = getAccurateMoonAge(new Date());
    const phaseName = getMoonPhaseName(lunarAge);

    const moonPhaseIcons = {
        'New Moon': '/assets/moonphase-widget/new-moon.png',
        'Waxing Crescent': '/assets/moonphase-widget/waxing-crescent.png',
        'First Quarter': '/assets/moonphase-widget/first-quarter.png',
        'Waxing Gibbous': '/assets/moonphase-widget/waxing-gibbous.png',
        'Full Moon': '/assets/moonphase-widget/full-moon.png',
        'Waning Gibbous': '/assets/moonphase-widget/waning-gibbous.png',
        'Last Quarter': '/assets/moonphase-widget/last-quarter.png',
        'Waning Crescent': '/assets/moonphase-widget/waning-crescent.png'
    };

    const moonIcon = document.querySelector('.moon-icon');
    const moonText = document.querySelector('.moon-phase-text');

    if (moonIcon && moonText) {
        moonIcon.src = moonPhaseIcons[phaseName];
        moonIcon.alt = `Current Moon Phase: ${phaseName}`;
        moonText.textContent = phaseName;
    }
	
	console.log("Calculated Lunar Age (in days):", lunarAge);
}

// And finally, the initialization
document.addEventListener('DOMContentLoaded', () => {
    moonPhaseWidget();
});