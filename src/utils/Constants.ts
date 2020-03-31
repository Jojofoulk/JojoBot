export const DISCORD_CONSTANTS = {
    MY_USER_ID: "102054983381311488"
}

export const RIOT_CONSTANTS = {
    URL: "https://REGION.api.riotgames.com/lol/",
    ENDPOINT_REGIONS: [
        "BR1",
        "EUN1",
        "EUW1",
        "JP1",
        "KR",
        "LA1",
        "LA2",
        "NA1",
        "OC1",
        "RU",
        "TR1"
    ],
    RANK_COLORS: {
        CHALLENGER: "#E6E1CF",
        GRANDMASTER: "#903642",
        MASTER: "#7A4D9B",
        DIAMOND: "#34A8FA",
        PLATINUM: "#339E81",
        GOLD: "#D4AF37",
        SILVER: "#BEC2CB",
        BRONZE: "#A97142",
        IRON: "#392112",
        UNRANKED: "#272727"
    },
    //merge with endpoint_regions into an array of object, each object has a region with all possible name foe it (e.g: euw, europe west, ...), the opgg domain, the API riot domain, and other properties
    OP_GG_DOMAINS : {
        "BR1": "br.",
        "EUN1": "eune.",
        "EUW1": "euw.",
        "JP1": "jp.",
        "KR": "",
        "LA1": "lan.",
        "LA2": "las.",
        "NA1": "na.",
        "OC1": "oce.",
        "RU": "ru.",
        "TR1": "tr. "
    }
};