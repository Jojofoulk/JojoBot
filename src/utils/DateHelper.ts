export default class DateHelper {

    /** Expect Date object or ISOString format */
    static formatDateString(date: Date | string): string {

        if (date instanceof Date) {
            return date.toISOString().substr(0, 10).split('-').reverse().join('/') + " " + date.toISOString().substring(11, 19);
        }
        else{
            return date.substr(0, 10).split('-').reverse().join('/') + " " + date.substring(11, 18);
        }
    }

   /**
    * @param dateTime - The date time in seconds
    */
    static dateTimeToFormattedString(dateTime: number): string {
        let minutes = '' + (Math.floor(dateTime / 60));
        minutes = ((+minutes < 10) ? '0':'') + minutes
        var seconds = '' + dateTime % 60;
        seconds = ((+seconds < 10) ? '0':'') + seconds
        return `${minutes}:${seconds}`
    }
}