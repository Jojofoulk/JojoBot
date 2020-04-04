//#region  =================================   SUMMONER   ==========================================
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
//#endregion

//#region  =================================   ENTRY (LEAGUE/RANK)   ==========================================
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
class MiniSeriesDTO {
    losses:	number;
    progress: string;	
    target: number;	
    wins: number;
}
//#endregion


//#region =================================   MASTERY   ==========================================
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
//#endregion

//#region  =================================   CURRENT GAME INFO   ==========================================
export class CurrentGameInfo {
    /** The ID of the game */
    gameId: number;
    /** The game type */
    gameType: string;
    /** The game start time represented in epoch milliseconds */
    gameStartTime: number;
    /** The ID of the map */
    mapId: number;
    /** The amount of time in seconds that has passed since the game started */
    gameLength: number;
    /** The ID of the platform on which the game is being played */
    platformId: string;
    /** The game mode */
    gameMode: string;
    /** Banned champion information */
    bannedChampions: BannedChampion[];
    /** The queue type (queue types are documented on the Game Constants page) */
    gameQueueConfigId: number;
    /** The observer information */
    observers: Observer;
    /** The participant information */
    participants: CurrentGameParticipant[];
}

class BannedChampion {
    /** The turn during which the champion was banned */
    pickTurn: number;
    /** The ID of the banned champion */
    championId: number;
    /** The ID of the team that banned the champion */
    teamId: number;
}

class Observer {
/** Key used to decrypt the spectator grid game data for playback */
encryptionKey: string;
}

class CurrentGameParticipant {
    /** The ID of the champion played by this participant */
    championId: number;
    /** Perks/Runes Reforged Information */
    perks: Perks;
    /** The ID of the profile icon used by this participant */
    profileIconId: number;
    /** Flag indicating whether or not this participant is a bot */
    bot: boolean;
    /** The team ID of this participant, indicating the participant's team */
    teamId: number;
    /** The summoner name of this participant */
    summonerName: string;
    /** The encrypted summoner ID of this participant */
    summonerId: string;
    /** The ID of the first summoner spell used by this participant */
    spell1Id: number;
    /** The ID of the second summoner spell used by this participant */
    spell2Id: number;
    /** List of Game Customizations */
    gameCustomizationObjects: GameCustomizationObject[];
}

class Perks {
    /** IDs of the perks/runes assigned. */
    perkIds: number[];
    /** Primary runes path */
    perkStyle: number;
    /** Secondary runes pat */
    perkSubStyle: number;
}

class GameCustomizationObject {
    /** Category identifier for Game Customization */
    category: string;
    /** Game Customization content */
    content: string;
}
//#endregion


//#region  =================================   MATCH LIST   ==========================================
export class MatchListDto {
    startIndex: number;	
    totalGames: number;
    endIndex: number;	
    matches: MatchReferenceDto[]
}

class MatchReferenceDto {
    gameId: number;
    role: string;
    season: number;
    platformId: string;
    champion: number;
    queue: number;
    lane: string;
    timestamp: number;
}
//#endregion