export class RiotSummoner {
    constructor(){}
    /** Encrypted account ID. Max length 56 characters. */
    accountId: string;
    /** ID of the summoner icon associated with the summoner. */
    profileIconId: number;	
    /**	Date summoner was last modified specified as epoch milliseconds. The following events will update this timestamp: profile icon change, playing the tutorial or advanced tutorial, finishing a game, summoner name change */
    revisionDate: number
    /**	Summoner name. */
    name: string
    /**	Encrypted summoner ID. Max length 63 characters. */
    id: string
    /** Encrypted PUUID. Exact length of 78 characters. */
    puuid: string
    /** Summoner level associated with the summoner. */
    summonerLevel: number;
}

export class RiotEntry {
    leagueId: string;	
    /** Player's encrypted summonerId. */
    summonerId:	string
    summonerName: string	
    queueType: string	
    tier: string	
    rank: string	
    leaguePoints: number	
    /** Winning team on Summoners Rift. */
    wins: number	
    /** Losing team on Summoners Rift. */
    losses: number
    hotStreak: boolean	
    veteran: boolean	
    freshBlood: boolean	
    inactive: boolean	
    miniSeries: MiniSeriesDTO	;
}

export class RiotMastery {
	/** Number of points needed to achieve next level. Zero if player reached maximum champion level for this champion. */
    championPointsUntilNextLevel: number;
	/** Is chest granted for this champion or not in current season. */
    chestGranted: boolean;
	/** Champion ID for this entry. */
    championId: number;
	/** Last time this champion was played by this player - in Unix milliseconds time format. */
    lastPlayTime: number;
	/** Champion level for specified player and champion combination. */
    championLevel: number;
	/** Summoner ID for this entry. (Encrypted) */
    summonerId: string;
	/** Total number of champion points for this player and champion combination - they are used to determine championLevel. */
    championPoints: number;
	/** Number of points earned since current level has been achieved. */
    championPointsSinceLastLevel: number;
	/** The token earned for this champion to levelup. */
    tokensEarned: number;
}

class MiniSeriesDTO {
    losses:	number;
    progress: string;	
    target: number;	
    wins: number;
}

