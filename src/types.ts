declare module 'koishi' {
  interface Tables {
    game_mini_player: GamePlayerData
    game_mini_state: GameStateRecord
  }
}

export interface GamePlayerData {
  id: number
  guildId: string
  platform: string
  userId: string
  name: string
  score: number
  correctCount: number
  playCount: number
  lastGameTime: number
}

export interface GameStateRecord {
  key: string
  state: string
  updatedAt: number
}

export interface PlayerData {
  platform: string
  userId: string
  name: string
  score: number
  correctCount: number
  playCount: number
  lastGameTime: number
  guildId?: string
}

export interface BaseGameState {
  started: boolean
  totalRounds: number
  currentRound: number
  players: { [key: string]: PlayerData }
  participants: string[]
  stopTimer?: NodeJS.Timeout
  autoPlayTimer?: NodeJS.Timeout
}

export interface GuessNumberState extends BaseGameState {
  target: number
  currentMin: number
  currentMax: number
  autoPlayCount: number
}

export interface TurtleSoupState extends BaseGameState {
  storyContent: string
  storyAnswer: string
  remainingQuestions: number
}

export interface GameState {
  guessNumber: GuessNumberState
  turtleSoup: TurtleSoupState
}

export type GameType = 'guessNumber' | 'turtleSoup'

export interface Config {
  enableNumberGuess: boolean
  enableTurtleSoup: boolean
  privateGame: {
    enableNumberGuess: boolean
    enableTurtleSoup: boolean
  }
  debug: {
    enableLog: boolean
  }
  gameMessages: {
    enabled: boolean
    usage: string
    start: string
    stop: string
    notStarted: string
    apiError: string
    correct: string
    wrong: string
    roundEnd: string
    gameEnd: string
    rankTitle: string
    rankEmpty: string
    disabled: string
    autoStop: string
  }
  guessNumberMessages: {
    outOfRange: string
    tooSmall: string
    tooBig: string
    correctDetail: string
  }
  turtleSoupMessages: {
    story: string
    questionHint: string
    guessCorrect: string
    noMoreQuestions: string
    aiGenerationFailed: string
    generating: string
  }
  commonMessages: {
    gameRunning: string
    paramError: string
  }
  guessNumber: {
    min: number
    max: number
    botParticipateInGroup: boolean
    totalRounds: number
    showRank: boolean
    autoPlayDelay: number
    autoPlayMaxCount: number
    autoStopInactiveTime: number
    enablePenalty: boolean
    penaltyScore: number
    rewardScore: number
  }
  turtleSoup: {
    totalRounds: number
    showRank: boolean
    maxQuestions: number
    autoStopInactiveTime: number
    rewardScore: number
    apiEndpoint: string
    apiKey: string
    model: string
  }
  apiConfig: {
    timeout: number
  }
}
