/**
 * This algorithm finds best starting date of special event in each country
 *
 * @author Yang Liu
 * @version Apr 27, 2017
 */


var MILLIS_A_DAY = 1000 * 60 * 60 * 24; // number of milliseconds in a day

/**
 * Organize partners based on their country
 *
 * @param {Array} partners - all partners each come from different country
 * @returns {Object} a dictionary with key equals to country name and value equals to array of partners in that country
 */
function categorizePartnerByCountry(partners) {
    var countries = {};
    partners.forEach(function (partner) {
        var country = partner["country"];
        if (countries.hasOwnProperty(country))
            countries[country].push(partner);
        else countries[country] = [partner];
    });
    return countries;
}

/**
 * Sort dates with earlier date in front of later date
 *
 * @param {Array<String>} dates - array of unsorted dates in ISO 8601 format
 * @returns {Array<String>} array of sorted dates in ISO 8601 format
 */
function sortDatesInAscendingOrder(dates) {
    return dates.sort(function (date1, date2) {
        return new Date(date1).getTime() - new Date(date2).getTime();
    });
}

/**
 * Check whether two days are in a row
 *
 * @param {String} firstDay - the earlier date
 * @param {String} secondDay - the later date
 * @returns {boolean} true if the first day and the second day are in a row
 */
function areConsecutiveDates(firstDay, secondDay) {
    var millisDiff = new Date(secondDay).getTime() - new Date(firstDay).getTime();
    return millisDiff === MILLIS_A_DAY;
}

/**
 * Increment key count for the given object
 *
 * @param {Object} object - the target object
 * @param {String} key - the target key
 */
function incrementKeyCount(object, key) {
    object[key] = object.hasOwnProperty(key) ? object[key] + 1 : 1;
}

/**
 * Filter out starting dates with two days in a row from sorted array of dates
 *
 * @param {Array<String>} dates - sorted array of dates
 * @returns {Array<String>} array of starting dates with two days in a row
 */
function getConsecutiveDates(dates) {
    var sortedDates = sortDatesInAscendingOrder(dates);
    var consecutiveDates = [];
    for (var i = 0; i < sortedDates.length - 1; i++)
        if (areConsecutiveDates(sortedDates[i], sortedDates[i + 1]))
            consecutiveDates.push(sortedDates[i]);
    return consecutiveDates;
}

/**
 * Get array of available starting dates for the given country
 *
 * @param {Object} country - the given country
 * @returns {Object} array of available starting dates
 */
function getAvailableStartingDatesForCountry(country) {
    var dates = {};
    country.forEach(function (partner) {
        var partnerAvaStaringDates = getConsecutiveDates(partner["availableDates"]);
        partnerAvaStaringDates.forEach(function (date) {
            incrementKeyCount(dates, date);
        });
    });
    return dates;
}

/**
 * Get the first starting date with the most attendee
 *
 * @param {Array<String>} avaStartingDates - array of available starting dates with corresponding attendee counts
 * @returns {String} the first starting date with the most attendee
 */
function getBestStartingDate(avaStartingDates) {
    return Object.keys(avaStartingDates).reduce(function (currentResult, date) {
        if (avaStartingDates[date] > currentResult.numAttendee)
            return {numAttendee: avaStartingDates[date], bestDate: date};
        else return currentResult;
    }, {numAttendee: 0, bestDate: null}).bestDate;
}

/**
 * Return a function which can be used to check whether a partner is able to attend the event with the given starting date
 *
 * @param {String} bestStartingDate - the given starting date
 * @returns {Function} a function which can be used to check whether a partner is able to attend the event with the given
 * starting date
 */
function isPartnerAvailable(bestStartingDate) {
    return function (partner) {
        var partnerAvaStaringDates = getConsecutiveDates(partner["availableDates"]);
        return partnerAvaStaringDates.some(function (startingDate) {
            return startingDate === bestStartingDate
        });
    }
}

/**
 * Filter out all partners who are able to attend the event with the given starting date
 *
 * @param {Array<Object>} partners - array of partners
 * @param {String} bestStartingDate - the given starting date
 * @returns {Array<Object>} array of partners who are able to attend the event with the given starting date
 */
function getAllAvailablePartners(partners, bestStartingDate) {
    return partners.filter(isPartnerAvailable(bestStartingDate));
}

/**
 * Get the email address for a specific partner
 *
 * @param {Object} partner - the partner
 * @returns {String} the email address for a specific partner
 */
function getPartnerEmail(partner) {
    return partner["email"];
}

/**
 * Format result for given country
 *
 * @param {Array<String>} emails - array of attendee emails
 * @param {String} countryName - name of the country
 * @param {String} bestStartingDate - the starting date of the event in the country
 * @returns {Object} formatted result for given country
 */
function formatResultForCountry(emails, countryName, bestStartingDate) {
    return {
        "attendeeCount": emails.length,
        "attendees": emails,
        "name": countryName,
        "startDate": bestStartingDate
    }
}

/**
 * Format result to json response
 *
 * @param {Array<Object>} bestStartingDatesForCountries - array of results for all the countries
 * @returns {Object} formatted json response
 */
function formatResponse(bestStartingDatesForCountries) {
    return {"countries": bestStartingDatesForCountries};
}

/**
 * Find the best staring dates for the given countries
 *
 * @param {Object} countries - the given countries
 * @returns {Array<Object>} array of formatted result for the given countries
 */
function findBestStartingDatesForCountries(countries) {
    return Object.keys(countries).map(function (countryName) {
        var avaStartingDates = getAvailableStartingDatesForCountry(countries[countryName]);
        var bestStartingDate = getBestStartingDate(avaStartingDates);
        var partnerEmails = getAllAvailablePartners(countries[countryName], bestStartingDate).map(getPartnerEmail);
        return formatResultForCountry(partnerEmails, countryName, bestStartingDate);
    });
}

/**
 * Solve the challenge for the given input
 * @param {Array<Object>} input - the given input
 * @returns {Object} the solution
 */
function solveChallenge(input) {
    var partners = input["partners"];
    var countries = categorizePartnerByCountry(partners);
    var bestStartingDatesForCountries = findBestStartingDatesForCountries(countries);
    return formatResponse(bestStartingDatesForCountries);
}

/**
 * Check whether the solution is correct
 *
 * @param {Object} response - the response
 */
function testResponse(response) {
    var responseStr = JSON.stringify(response);
    $.post("https://candidate.hubteam.com/candidateTest/v2/results?userKey=a41726601a589799f17f97537c06", responseStr, function (res, status) {
        if (status === "success") console.log("Correctly refactored the code base!");
        else console.log("Something went wrong during refactor.");
    });
}

window.onload = function () {
    $.get("https://candidate.hubteam.com/candidateTest/v2/partners?userKey=a41726601a589799f17f97537c06", function (input) {
        var response = solveChallenge(input);
        testResponse(response);
    });
};