import { Context, Schema, Random, Logger, Session } from 'koishi'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import axios from 'axios'

export const name = 'game-mini'
export const using = ['i18n', 'database'] as const
export const inject = ['console'] as const

declare module 'koishi' {
  interface Tables {
    game_mini_player: GamePlayerData
    game_mini_state: GameStateRecord
  }
}

interface GamePlayerData {
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

interface GameStateRecord {
  key: string
  state: string
  updatedAt: number
}

interface PlayerData {
  platform: string
  userId: string
  name: string
  score: number
  correctCount: number
  playCount: number
  lastGameTime: number
  guildId?: string
}

interface BaseGameState {
  started: boolean
  totalRounds: number
  currentRound: number
  players: { [key: string]: PlayerData }
  participants: string[]
  stopTimer?: NodeJS.Timeout
  autoPlayTimer?: NodeJS.Timeout
}

interface GuessNumberState extends BaseGameState {
  target: number
  currentMin: number
  currentMax: number
  botGuess: number[]
  autoPlayCount: number
}

interface TurtleSoupState extends BaseGameState {
  storyContent: string
  storyAnswer: string
  remainingQuestions: number
  guessed: boolean
  maxQuestions: number
}

interface GameState {
  guessNumber: GuessNumberState
  turtleSoup: TurtleSoupState
}

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

const defaultMessages = {
  gameMessages: {
    usage: "用法错误！正确用法：{0}",
    start: "比赛开始！本次共 {0} 回合～",
    stop: "比赛已停止",
    notStarted: "比赛尚未开始，请输入 {0} 开始 开始游戏",
    apiError: "API请求失败，请稍后再试",
    correct: "答对啦！你获得 {0} 分～",
    wrong: "答错啦～正确答案是：{0}，你不得分",
    roundEnd: "第 {0} 回合结束！剩余回合：{1}",
    gameEnd: "比赛结束！",
    rankTitle: "本局排行榜",
    rankEmpty: "暂无参与记录～",
    disabled: "该功能已关闭，请联系管理员开启",
    autoStop: "太久没人玩啦，比赛自动结束～"
  },
  guessNumberMessages: {
    outOfRange: "数字超出当前范围 [{0}-{1}]，请重新输入！",
    tooSmall: "猜小啦！当前范围更新为 [{0}-{1}]",
    tooBig: "猜大啦！当前范围更新为 [{0}-{1}]",
    correctDetail: "恭喜你猜中数字！\n猜中者扣 {0} 分，其他玩家各加 {1} 分"
  },
  turtleSoupMessages: {
    story: "汤面：{0}\n发送你的问题或猜测，主持人会回答你。\n剩余提问次数：{1}",
    questionHint: "发送你的问题或猜测...",
    guessCorrect: "恭喜你猜中了！汤底：{0}",
    noMoreQuestions: "提问次数已用完！汤底：{0}",
    aiGenerationFailed: "AI生成海龟汤失败，请稍后重试",
    generating: "正在生成海龟汤，请稍候..."
  },
  common: {
    gameRunning: "当前已有游戏在运行中，请先结束当前游戏后再开始新游戏！",
    paramError: "参数错误！请检查输入格式"
  }
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    enableNumberGuess: Schema.boolean().default(true).description('启用猜数字游戏'),
    enableTurtleSoup: Schema.boolean().default(true).description('启用海龟汤游戏'),
  }).description('游戏开关'),

  Schema.object({
    privateGame: Schema.object({
      enableNumberGuess: Schema.boolean().default(true).description('允许私聊玩猜数字'),
      enableTurtleSoup: Schema.boolean().default(true).description('允许私聊玩海龟汤'),
    }).description('私聊游戏开关'),
  }),

  Schema.object({
    debug: Schema.object({
      enableLog: Schema.boolean().default(false).description('启用调试日志输出'),
    }).description('调试配置'),
  }),

  Schema.object({
    gameMessages: Schema.object({
      enabled: Schema.boolean().default(true).description('启用自定义通用消息'),
      usage: Schema.string().default(defaultMessages.gameMessages.usage).description('用法错误提示\n{0}-命令格式'),
      start: Schema.string().default(defaultMessages.gameMessages.start).description('游戏开始提示\n{0}-总回合数'),
      stop: Schema.string().default(defaultMessages.gameMessages.stop).description('游戏停止提示'),
      notStarted: Schema.string().default(defaultMessages.gameMessages.notStarted).description('游戏未开始提示\n{0}-开始命令'),
      apiError: Schema.string().default(defaultMessages.gameMessages.apiError).description('API错误提示'),
      correct: Schema.string().default(defaultMessages.gameMessages.correct).description('答对提示\n{0}-获得分数'),
      wrong: Schema.string().default(defaultMessages.gameMessages.wrong).description('答错提示\n{0}-正确答案'),
      roundEnd: Schema.string().default(defaultMessages.gameMessages.roundEnd).description('回合结束提示\n{0}-当前回合, {1}-剩余回合'),
      gameEnd: Schema.string().default(defaultMessages.gameMessages.gameEnd).description('游戏结束提示'),
      rankTitle: Schema.string().default(defaultMessages.gameMessages.rankTitle).description('本局排行榜标题'),
      rankEmpty: Schema.string().default(defaultMessages.gameMessages.rankEmpty).description('本局排行榜为空提示'),
      disabled: Schema.string().default(defaultMessages.gameMessages.disabled).description('功能禁用提示'),
      autoStop: Schema.string().default(defaultMessages.gameMessages.autoStop).description('自动停止提示'),
    }).description('通用游戏消息配置'),

    guessNumberMessages: Schema.object({
      outOfRange: Schema.string().default(defaultMessages.guessNumberMessages.outOfRange).description('数字超出范围提示\n{0}-最小值, {1}-最大值'),
      tooSmall: Schema.string().default(defaultMessages.guessNumberMessages.tooSmall).description('猜小了提示\n{0}-新最小值, {1}-新最大值'),
      tooBig: Schema.string().default(defaultMessages.guessNumberMessages.tooBig).description('猜大了提示\n{0}-新最小值, {1}-新最大值'),
      correctDetail: Schema.string().default(defaultMessages.guessNumberMessages.correctDetail).description('猜中详细提示\n{0}-扣分数, {1}-加分数'),
    }).description('猜数字专用消息'),

    turtleSoupMessages: Schema.object({
      story: Schema.string().default(defaultMessages.turtleSoupMessages.story).description('汤面展示\n{0}-汤面内容, {1}-剩余提问次数'),
      questionHint: Schema.string().default(defaultMessages.turtleSoupMessages.questionHint).description('提问提示'),
      guessCorrect: Schema.string().default(defaultMessages.turtleSoupMessages.guessCorrect).description('猜中提示\n{0}-汤底'),
      noMoreQuestions: Schema.string().default(defaultMessages.turtleSoupMessages.noMoreQuestions).description('无提问次数提示\n{0}-汤底'),
      aiGenerationFailed: Schema.string().default(defaultMessages.turtleSoupMessages.aiGenerationFailed).description('AI生成失败提示'),
      generating: Schema.string().default(defaultMessages.turtleSoupMessages.generating).description('生成中提示'),
    }).description('海龟汤专用消息'),
  }),

  Schema.object({
    commonMessages: Schema.object({
      gameRunning: Schema.string().default(defaultMessages.common.gameRunning).description('游戏运行中提示'),
      paramError: Schema.string().default(defaultMessages.common.paramError).description('参数错误提示'),
    }).description('通用消息配置'),
  }),

  Schema.object({
    guessNumber: Schema.object({
      min: Schema.number().min(0).default(0).description('最小值'),
      max: Schema.number().min(1).default(100).description('最大值'),
      botParticipateInGroup: Schema.boolean().default(true).description('群聊中机器人是否参与'),
      totalRounds: Schema.number().min(1).default(10).description('总回合数'),
      showRank: Schema.boolean().default(true).description('游戏结束后显示本局排行榜'),
      autoPlayDelay: Schema.number().min(0).default(10).description('机器人自动操作延迟（秒）'),
      autoPlayMaxCount: Schema.number().min(1).default(5).description('机器人最大自动操作次数'),
      autoStopInactiveTime: Schema.number().min(0).default(60).description('游戏无操作自动停止时间（秒）'),
      enablePenalty: Schema.boolean().default(true).description('启用惩罚机制（猜中者扣分，其他人加分）'),
      penaltyScore: Schema.number().max(0).default(-1).description('猜中者扣除分数'),
      rewardScore: Schema.number().min(0).default(1).description('其他人奖励分数'),
    }).description('猜数字游戏配置'),
  }),

  Schema.object({
    turtleSoup: Schema.object({
      totalRounds: Schema.number().min(1).default(3).description('总回合数'),
      showRank: Schema.boolean().default(true).description('游戏结束后显示本局排行榜'),
      maxQuestions: Schema.number().min(1).default(50).description('每回合最大提问次数'),
      autoStopInactiveTime: Schema.number().min(0).default(120).description('游戏无操作自动停止时间（秒）'),
      rewardScore: Schema.number().min(0).default(3).description('猜对奖励分数'),
      apiEndpoint: Schema.string().default('https://api.openai.com/v1').description('AI API 地址'),
      apiKey: Schema.string().role('secret').default('').description('AI API 密钥'),
      model: Schema.string().default('').description('AI 模型（如 gpt-3.5-turbo）'),
    }).description('海龟汤配置'),
  }),

  Schema.object({
    apiConfig: Schema.object({
      timeout: Schema.number().min(0).default(30000).description('API请求超时时间（毫秒，0为不超时）'),
    }).description('API接口配置'),
  }),
])

const logger = new Logger('game-mini')
const gameStates = new Map<string, GameState>()

const getSessionKey = (s: Session) => s.channelId ? `g:${s.channelId}` : `p:${s.userId}`
const getPlayerKey = (s: Session) => `${s.platform}_${s.userId}`

export async function apply(ctx: Context, cfg: Config) {
  ctx.model.extend('game_mini_player', {
    id: 'unsigned',
    guildId: 'string',
    platform: 'string',
    userId: 'string',
    name: 'string',
    score: 'integer',
    correctCount: 'integer',
    playCount: 'integer',
    lastGameTime: 'unsigned'
  }, {
    primary: 'id',
    autoInc: true,
    unique: [['guildId', 'platform', 'userId']]
  })

  ctx.model.extend('game_mini_state', {
    key: 'string',
    state: 'text',
    updatedAt: 'unsigned'
  }, {
    primary: 'key'
  })

  const d = {
    game: cfg.gameMessages.enabled ? cfg.gameMessages : defaultMessages.gameMessages,
    guessNumber: cfg.guessNumberMessages,
    turtleSoup: cfg.turtleSoupMessages,
    common: cfg.commonMessages
  }

  try {
    const p = path.join(__dirname, './locales/zh-CN.yml')
    if (fs.existsSync(p)) ctx.i18n.define('zh-CN', yaml.parse(fs.readFileSync(p, 'utf8')))
    else ctx.i18n.define('zh-CN', d as any)
  } catch { ctx.i18n.define('zh-CN', d as any) }

  const isPrivate = (s: Session) => !s.channelId

  const canPlayPrivate = (game: string) => {
    const map: Record<string, boolean> = {
      guessNumber: cfg.privateGame.enableNumberGuess,
      turtleSoup: cfg.privateGame.enableTurtleSoup
    }
    return map[game] ?? false
  }

  const getUserId = (session: Session): string => {
    return session.userId || '0'
  }

  const logDebug = (message: string, data?: any) => {
    if (cfg.debug.enableLog) {
      if (data) logger.info(`${message} ${JSON.stringify(data)}`)
      else logger.info(message)
    }
  }

  const logError = (message: string, error?: any) => {
    logger.error(message)
    if (cfg.debug.enableLog && error) logger.error(JSON.stringify(error))
  }

  const getPlayerData = async (session: Session): Promise<PlayerData> => {
    if (!session.channelId) {
      return {
        platform: session.platform,
        userId: session.userId || 'unknown_user',
        name: session.username || session.userId || '未知用户',
        score: 0,
        correctCount: 0,
        playCount: 0,
        lastGameTime: 0
      }
    }

    const guildId = session.channelId
    const platform = session.platform
    const userId = session.userId || 'unknown_user'
    const name = session.username || userId

    let player = await ctx.database.get('game_mini_player', { guildId, platform, userId })

    if (!player.length) {
      const newPlayer = {
        guildId,
        platform,
        userId,
        name,
        score: 0,
        correctCount: 0,
        playCount: 0,
        lastGameTime: 0
      }
      await ctx.database.create('game_mini_player', newPlayer)
      return { guildId, platform, userId, name, score: 0, correctCount: 0, playCount: 0, lastGameTime: 0 }
    }

    return player[0]
  }

  const savePlayerData = async (guildId: string, playerData: PlayerData) => {
    if (!guildId) return
    await ctx.database.set('game_mini_player',
      { guildId, platform: playerData.platform, userId: playerData.userId },
      {
        name: playerData.name,
        score: playerData.score,
        correctCount: playerData.correctCount,
        playCount: playerData.playCount,
        lastGameTime: playerData.lastGameTime
      }
    )
  }

  const updatePlayerPlayCount = async (session: Session) => {
    if (!session.channelId) return
    const player = await getPlayerData(session)
    player.playCount += 1
    player.lastGameTime = Date.now()
    await savePlayerData(session.channelId, player)
  }

  const generateGameRankText = (players: { [key: string]: PlayerData }) => {
    const playerList = Object.values(players)
    if (playerList.length === 0) return `${d.game.rankTitle}\n${d.game.rankEmpty}`
    const sortedPlayers = playerList.sort((a, b) => b.score - a.score)
    let rankText = `${d.game.rankTitle}\n`
    sortedPlayers.forEach((player, index) => {
      rankText += `${index + 1}. ${player.name} - 得分：${player.score}分\n`
    })
    return rankText.trim()
  }

  const serializeState = (state: GameState): string => {
    const copy: any = JSON.parse(JSON.stringify(state))
    delete copy.guessNumber.stopTimer
    delete copy.guessNumber.autoPlayTimer
    delete copy.turtleSoup.stopTimer
    delete copy.turtleSoup.autoPlayTimer
    return JSON.stringify(copy)
  }

  const deserializeState = (json: string): GameState => {
    const state = JSON.parse(json) as GameState
    if (!state.guessNumber) state.guessNumber = createGuessNumberState()
    if (!state.turtleSoup) state.turtleSoup = createTurtleSoupState()
    return state
  }

  const saveGameState = async (key: string, state: GameState) => {
    try {
      const json = serializeState(state)
      await ctx.database.upsert('game_mini_state', [{ key, state: json, updatedAt: Date.now() }])
    } catch (e) {
      logError('保存游戏状态失败', e)
    }
  }

  const loadGameState = async (key: string): Promise<GameState | null> => {
    try {
      const rows = await ctx.database.get('game_mini_state', { key })
      if (rows.length > 0) {
        return deserializeState(rows[0].state)
      }
    } catch (e) {
      logError('加载游戏状态失败', e)
    }
    return null
  }

  const createGuessNumberState = (): GuessNumberState => ({
    started: false,
    totalRounds: cfg.guessNumber.totalRounds,
    currentRound: 0,
    players: {},
    participants: [],
    target: 0,
    currentMin: cfg.guessNumber.min,
    currentMax: cfg.guessNumber.max,
    botGuess: [],
    autoPlayCount: 0
  })

  const createTurtleSoupState = (): TurtleSoupState => ({
    started: false,
    totalRounds: cfg.turtleSoup.totalRounds,
    currentRound: 0,
    players: {},
    participants: [],
    storyContent: '',
    storyAnswer: '',
    remainingQuestions: cfg.turtleSoup.maxQuestions,
    guessed: false,
    maxQuestions: cfg.turtleSoup.maxQuestions
  })

  const createInitialState = (): GameState => ({
    guessNumber: createGuessNumberState(),
    turtleSoup: createTurtleSoupState()
  })

  const getOrCreateState = async (key: string): Promise<GameState> => {
    if (gameStates.has(key)) return gameStates.get(key)!
    const loaded = await loadGameState(key)
    if (loaded) {
      gameStates.set(key, loaded)
      return loaded
    }
    const fresh = createInitialState()
    gameStates.set(key, fresh)
    await saveGameState(key, fresh)
    return fresh
  }

  const checkGameRunning = (st: GameState, gameType: 'guessNumber' | 'turtleSoup'): boolean => {
    if (gameType !== 'guessNumber' && st.guessNumber.started) return true
    if (gameType !== 'turtleSoup' && st.turtleSoup.started) return true
    return false
  }

  const clearGameTimer = (state: BaseGameState) => {
    if (state.stopTimer) clearTimeout(state.stopTimer)
    if (state.autoPlayTimer) clearTimeout(state.autoPlayTimer)
  }

  const clearGameData = (gameState: BaseGameState, showRank: boolean = false, session?: Session) => {
    if (showRank && session && session.channelId) {
      session.send(generateGameRankText(gameState.players))
    }
    gameState.players = {}
    gameState.participants = []
    gameState.currentRound = 0
    gameState.started = false
    clearGameTimer(gameState)
  }

  const setupAutoStop = (session: Session, state: BaseGameState, gameType: 'guessNumber' | 'turtleSoup', showRank: boolean, key: string) => {
    clearGameTimer(state)
    const inactiveMap = {
      guessNumber: cfg.guessNumber.autoStopInactiveTime,
      turtleSoup: cfg.turtleSoup.autoStopInactiveTime
    }
    const inactiveTime = inactiveMap[gameType] ?? 60
    if (inactiveTime <= 0) return
    state.stopTimer = setTimeout(() => {
      const st = gameStates.get(key)
      if (!st) return
      clearGameData(state, showRank, session)
      session.send(d.game.autoStop).catch(() => {})
      saveGameState(key, st)
    }, inactiveTime * 1000)
  }

  const generateTurtleSoup = async (): Promise<{story: string, answer: string} | null> => {
    try {
      const prompt = `你是一个海龟汤谜题创作者，请根据以下要求生成一个逻辑严密、反转精妙的海龟汤。

要求：
1. 汤面简洁，2~4句话，隐藏关键信息。
2. 汤底出人意料但合情合理，通常包含超自然、巧合或特殊身份设定。
3. 不要出现暴力、血腥、色情内容。
4. 难度适中，谜题有趣。

输出格式必须严格为：
【汤面】
汤面内容...
【汤底】
汤底内容...`

      const endpoint = cfg.turtleSoup.apiEndpoint.replace(/\/$/, '')
      const response = await axios.post(`${endpoint}/chat/completions`, {
        model: cfg.turtleSoup.model,
        messages: [
          { role: 'system', content: '你是一个精通海龟汤创作的游戏主持人。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 1024
      }, {
        headers: {
          'Authorization': `Bearer ${cfg.turtleSoup.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: cfg.apiConfig.timeout
      })

      const content = response.data?.choices?.[0]?.message?.content || ''
      const soupMatch = content.match(/【汤面】\s*([\s\S]*?)\s*【汤底】/i)
      const answerMatch = content.match(/【汤底】\s*([\s\S]*?)$/i)
      if (soupMatch && answerMatch) {
        return { story: soupMatch[1].trim(), answer: answerMatch[1].trim() }
      }
      return null
    } catch (e) {
      logError('AI生成海龟汤失败', e)
      return null
    }
  }

  const askTurtleSoupAI = async (story: string, answer: string, question: string): Promise<{reply: string, isCorrect: boolean} | null> => {
    try {
      const prompt = `你是海龟汤游戏主持人。汤面：${story}，汤底：${answer}。玩家提问：${question}
请根据汤底判断答案，必须从以下词汇中选择一个：是、不是、是或不是、不知道、不重要。
同时判断玩家是否完全准确地猜中了汤底的核心意思（允许表述不同，但核心逻辑一致）。如果猜中，输出“猜中”；否则“未猜中”。
严格按照JSON输出：{"answer": "选择的词汇", "win": "猜中或未猜中"}，不要额外内容。`

      const endpoint = cfg.turtleSoup.apiEndpoint.replace(/\/$/, '')
      const response = await axios.post(`${endpoint}/chat/completions`, {
        model: cfg.turtleSoup.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${cfg.turtleSoup.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: cfg.apiConfig.timeout
      })

      let raw = response.data?.choices?.[0]?.message?.content || ''
      let parsed: any = {}
      try {
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) raw = match[0]
        parsed = JSON.parse(raw)
      } catch {
        parsed.answer = raw.includes('是') ? '是' : '不知道'
        parsed.win = raw.includes('猜中') ? '猜中' : '未猜中'
      }
      return { reply: parsed.answer || '不知道', isCorrect: parsed.win === '猜中' }
    } catch (e) {
      logError('海龟汤AI交互失败', e)
      return null
    }
  }

  const doGuessNumberAutoPlay = async (session: Session, key: string, st: GameState) => {
    if (!st.guessNumber.started || st.guessNumber.autoPlayCount >= cfg.guessNumber.autoPlayMaxCount) return
    st.guessNumber.autoPlayCount++
    const guess = Random.int(st.guessNumber.currentMin, st.guessNumber.currentMax + 1)
    await session.send(`机器人猜：${guess}`)

    if (guess === st.guessNumber.target) {
      st.guessNumber.players['bot'] = st.guessNumber.players['bot'] || {
        platform: 'bot',
        userId: 'bot',
        name: '机器人',
        score: 0,
        correctCount: 0,
        playCount: 0,
        lastGameTime: 0
      }
      st.guessNumber.players['bot'].score += cfg.guessNumber.penaltyScore
      if (cfg.guessNumber.enablePenalty) {
        for (const pkey of Object.keys(st.guessNumber.players)) {
          if (pkey !== 'bot') {
            st.guessNumber.players[pkey].score += cfg.guessNumber.rewardScore
            if (session.channelId && pkey !== 'bot') {
              await savePlayerData(session.channelId, st.guessNumber.players[pkey])
            }
          }
        }
        await session.send(d.guessNumber.correctDetail.replace('{0}', String(-cfg.guessNumber.penaltyScore)).replace('{1}', String(cfg.guessNumber.rewardScore)))
      } else {
        await session.send(d.game.correct.replace('{0}', '0'))
      }
      st.guessNumber.currentRound++
      if (st.guessNumber.currentRound > st.guessNumber.totalRounds) {
        st.guessNumber.started = false
        clearGameTimer(st.guessNumber)
        await session.send(d.game.gameEnd)
        if (cfg.guessNumber.showRank && !isPrivate(session)) await session.send(generateGameRankText(st.guessNumber.players))
        clearGameData(st.guessNumber)
      } else {
        st.guessNumber.currentMin = cfg.guessNumber.min
        st.guessNumber.currentMax = cfg.guessNumber.max
        st.guessNumber.target = Random.int(cfg.guessNumber.min, cfg.guessNumber.max)
        st.guessNumber.autoPlayCount = 0
        await session.send(d.game.roundEnd.replace('{0}', String(st.guessNumber.currentRound)).replace('{1}', String(st.guessNumber.totalRounds - st.guessNumber.currentRound)))
        await session.send(`新回合开始！猜数字范围：${st.guessNumber.currentMin} - ${st.guessNumber.currentMax}`)
      }
    } else if (guess < st.guessNumber.target) {
      st.guessNumber.currentMin = guess + 1
      await session.send(d.guessNumber.tooSmall.replace('{0}', String(st.guessNumber.currentMin)).replace('{1}', String(st.guessNumber.currentMax)))
    } else {
      st.guessNumber.currentMax = guess - 1
      await session.send(d.guessNumber.tooBig.replace('{0}', String(st.guessNumber.currentMin)).replace('{1}', String(st.guessNumber.currentMax)))
    }
    await saveGameState(key, st)
    setupAutoStop(session, st.guessNumber, 'guessNumber', cfg.guessNumber.showRank, key)
  }

  ctx.middleware(async (session, next) => {
    if (!session.content) return next()
    const key = getSessionKey(session)
    const st = await getOrCreateState(key)

    if (isPrivate(session)) {
      const gameActive = st.guessNumber.started || st.turtleSoup.started
      if (gameActive) {
        if (st.guessNumber.started && !canPlayPrivate('guessNumber')) return next()
        if (st.turtleSoup.started && !canPlayPrivate('turtleSoup')) return next()
      }
    }

    const content = session.content.trim()
    const playerKey = getPlayerKey(session)

   if (cfg.enableNumberGuess && st.guessNumber.started) {
      clearGameTimer(st.guessNumber)
      if (!st.guessNumber.players[playerKey]) {
        const playerData = await getPlayerData(session)
        st.guessNumber.players[playerKey] = playerData
        st.guessNumber.participants.push(playerKey)
        await updatePlayerPlayCount(session)
      }

      if (content === '结束') {
        clearGameData(st.guessNumber, cfg.guessNumber.showRank && !isPrivate(session), session)
        await session.send(d.game.stop)
        await saveGameState(key, st)
        return
      }

      const num = parseInt(content)
      if (isNaN(num)) {
        await saveGameState(key, st)
        setupAutoStop(session, st.guessNumber, 'guessNumber', cfg.guessNumber.showRank, key)
        if (cfg.guessNumber.botParticipateInGroup && !isPrivate(session) && st.guessNumber.autoPlayCount < cfg.guessNumber.autoPlayMaxCount) {
          st.guessNumber.autoPlayTimer = setTimeout(() => {
            const currentSt = gameStates.get(key)
            if (currentSt) doGuessNumberAutoPlay(session, key, currentSt)
          }, cfg.guessNumber.autoPlayDelay * 1000)
        }
        return next()
      }

      if (num < st.guessNumber.currentMin || num > st.guessNumber.currentMax) {
        await session.send(d.guessNumber.outOfRange.replace('{0}', String(st.guessNumber.currentMin)).replace('{1}', String(st.guessNumber.currentMax)))
        await saveGameState(key, st)
        setupAutoStop(session, st.guessNumber, 'guessNumber', cfg.guessNumber.showRank, key)
        return
      }

      if (num === st.guessNumber.target) {
        st.guessNumber.players[playerKey].score += cfg.guessNumber.penaltyScore
        await savePlayerData(session.channelId!, st.guessNumber.players[playerKey])

        if (cfg.guessNumber.enablePenalty) {
          for (const pkey of Object.keys(st.guessNumber.players)) {
            if (pkey !== playerKey) {
              st.guessNumber.players[pkey].score += cfg.guessNumber.rewardScore
              if (session.channelId) {
                await savePlayerData(session.channelId, st.guessNumber.players[pkey])
              }
            }
          }
          await session.send(d.guessNumber.correctDetail.replace('{0}', String(-cfg.guessNumber.penaltyScore)).replace('{1}', String(cfg.guessNumber.rewardScore)))
        } else {
          await session.send(d.game.correct.replace('{0}', '0'))
        }

        st.guessNumber.currentRound++
        if (st.guessNumber.currentRound > st.guessNumber.totalRounds) {
          st.guessNumber.started = false
          clearGameTimer(st.guessNumber)
          await session.send(d.game.gameEnd)
          if (cfg.guessNumber.showRank && !isPrivate(session)) await session.send(generateGameRankText(st.guessNumber.players))
          clearGameData(st.guessNumber)
        } else {
          st.guessNumber.currentMin = cfg.guessNumber.min
          st.guessNumber.currentMax = cfg.guessNumber.max
          st.guessNumber.target = Random.int(cfg.guessNumber.min, cfg.guessNumber.max)
          st.guessNumber.autoPlayCount = 0
          await session.send(d.game.roundEnd.replace('{0}', String(st.guessNumber.currentRound)).replace('{1}', String(st.guessNumber.totalRounds - st.guessNumber.currentRound)))
          await session.send(`新回合开始！猜数字范围：${st.guessNumber.currentMin} - ${st.guessNumber.currentMax}`)
        }
      } else if (num < st.guessNumber.target) {
        st.guessNumber.currentMin = num + 1
        await session.send(d.guessNumber.tooSmall.replace('{0}', String(st.guessNumber.currentMin)).replace('{1}', String(st.guessNumber.currentMax)))
      } else {
        st.guessNumber.currentMax = num - 1
        await session.send(d.guessNumber.tooBig.replace('{0}', String(st.guessNumber.currentMin)).replace('{1}', String(st.guessNumber.currentMax)))
      }

      await saveGameState(key, st)
      setupAutoStop(session, st.guessNumber, 'guessNumber', cfg.guessNumber.showRank, key)
      if (cfg.guessNumber.botParticipateInGroup && !isPrivate(session) && st.guessNumber.autoPlayCount < cfg.guessNumber.autoPlayMaxCount) {
        st.guessNumber.autoPlayTimer = setTimeout(() => {
          const currentSt = gameStates.get(key)
          if (currentSt) doGuessNumberAutoPlay(session, key, currentSt)
        }, cfg.guessNumber.autoPlayDelay * 1000)
      }
      return
    }

    if (cfg.enableTurtleSoup && st.turtleSoup.started) {
      clearGameTimer(st.turtleSoup)
      if (!st.turtleSoup.players[playerKey]) {
        const playerData = await getPlayerData(session)
        st.turtleSoup.players[playerKey] = playerData
        st.turtleSoup.participants.push(playerKey)
        await updatePlayerPlayCount(session)
      }

      if (content === '结束') {
        clearGameData(st.turtleSoup, cfg.turtleSoup.showRank && !isPrivate(session), session)
        await session.send(d.game.stop)
        await saveGameState(key, st)
        return
      }

      if (st.turtleSoup.remainingQuestions <= 0) {
        await session.send(d.turtleSoup.noMoreQuestions.replace('{0}', st.turtleSoup.storyAnswer))
        st.turtleSoup.currentRound++
        if (st.turtleSoup.currentRound > st.turtleSoup.totalRounds) {
          st.turtleSoup.started = false
          await session.send(d.game.gameEnd)
          if (cfg.turtleSoup.showRank && !isPrivate(session)) await session.send(generateGameRankText(st.turtleSoup.players))
          clearGameData(st.turtleSoup)
        } else {
          await session.send(d.game.roundEnd.replace('{0}', String(st.turtleSoup.currentRound)).replace('{1}', String(st.turtleSoup.totalRounds - st.turtleSoup.currentRound)))
          const generated = await generateTurtleSoup()
          if (generated) {
            st.turtleSoup.storyContent = generated.story
            st.turtleSoup.storyAnswer = generated.answer
            st.turtleSoup.remainingQuestions = cfg.turtleSoup.maxQuestions
            st.turtleSoup.guessed = false
            await session.send(d.turtleSoup.story.replace('{0}', generated.story).replace('{1}', String(st.turtleSoup.remainingQuestions)))
          } else {
            await session.send(d.turtleSoup.aiGenerationFailed)
            st.turtleSoup.started = false
          }
        }
        await saveGameState(key, st)
        return
      }

      const aiResult = await askTurtleSoupAI(st.turtleSoup.storyContent, st.turtleSoup.storyAnswer, content)
      if (!aiResult) {
        await session.send(d.game.apiError)
        await saveGameState(key, st)
        setupAutoStop(session, st.turtleSoup, 'turtleSoup', cfg.turtleSoup.showRank, key)
        return
      }

      st.turtleSoup.remainingQuestions--
      await session.send(`${aiResult.reply} (剩余提问次数：${st.turtleSoup.remainingQuestions})`)

      if (aiResult.isCorrect) {
        st.turtleSoup.players[playerKey].score += cfg.turtleSoup.rewardScore
        st.turtleSoup.players[playerKey].correctCount += 1
        await savePlayerData(session.channelId!, st.turtleSoup.players[playerKey])
        await session.send(d.turtleSoup.guessCorrect.replace('{0}', st.turtleSoup.storyAnswer))
        st.turtleSoup.currentRound++
        if (st.turtleSoup.currentRound > st.turtleSoup.totalRounds) {
          st.turtleSoup.started = false
          await session.send(d.game.gameEnd)
          if (cfg.turtleSoup.showRank && !isPrivate(session)) await session.send(generateGameRankText(st.turtleSoup.players))
          clearGameData(st.turtleSoup)
        } else {
          await session.send(d.game.roundEnd.replace('{0}', String(st.turtleSoup.currentRound)).replace('{1}', String(st.turtleSoup.totalRounds - st.turtleSoup.currentRound)))
          const generated = await generateTurtleSoup()
          if (generated) {
            st.turtleSoup.storyContent = generated.story
            st.turtleSoup.storyAnswer = generated.answer
            st.turtleSoup.remainingQuestions = cfg.turtleSoup.maxQuestions
            st.turtleSoup.guessed = false
            await session.send(d.turtleSoup.story.replace('{0}', generated.story).replace('{1}', String(st.turtleSoup.remainingQuestions)))
          } else {
            await session.send(d.turtleSoup.aiGenerationFailed)
            st.turtleSoup.started = false
          }
        }
      } else if (st.turtleSoup.remainingQuestions <= 0) {
        await session.send(d.turtleSoup.noMoreQuestions.replace('{0}', st.turtleSoup.storyAnswer))
      }

      await saveGameState(key, st)
      setupAutoStop(session, st.turtleSoup, 'turtleSoup', cfg.turtleSoup.showRank, key)
      return
    }

    return next()
  })

  ctx.command('猜数字 <action> [param]', '猜数字游戏')
    .action(async (argv, action, param) => {
      const session = argv.session
      if (!session) return
      if (isPrivate(session) && !canPlayPrivate('guessNumber')) {
        await session.send(d.game.disabled)
        return
      }
      const key = getSessionKey(session)
      const st = await getOrCreateState(key)
      if (checkGameRunning(st, 'guessNumber')) {
        await session.send(d.common.gameRunning)
        return
      }
      if (action === '开始') {
        st.guessNumber.started = true
        st.guessNumber.target = Random.int(cfg.guessNumber.min, cfg.guessNumber.max)
        st.guessNumber.currentMin = cfg.guessNumber.min
        st.guessNumber.currentMax = cfg.guessNumber.max
        st.guessNumber.currentRound = 1
        st.guessNumber.autoPlayCount = 0
        await session.send(d.game.start.replace('{0}', String(st.guessNumber.totalRounds)))
        await session.send(`猜数字范围：${st.guessNumber.currentMin} - ${st.guessNumber.currentMax}`)
        await saveGameState(key, st)
        setupAutoStop(session, st.guessNumber, 'guessNumber', cfg.guessNumber.showRank, key)
        if (cfg.guessNumber.botParticipateInGroup && !isPrivate(session)) {
          st.guessNumber.autoPlayTimer = setTimeout(() => {
            const currentSt = gameStates.get(key)
            if (currentSt) doGuessNumberAutoPlay(session, key, currentSt)
          }, cfg.guessNumber.autoPlayDelay * 1000)
        }
      } else if (action === '结束') {
        clearGameData(st.guessNumber, cfg.guessNumber.showRank && !isPrivate(session), session)
        await session.send(d.game.stop)
        await saveGameState(key, st)
      } else {
        await session.send(d.game.usage.replace('{0}', '猜数字 开始 | [数字] | 猜数字 结束'))
      }
    })

  ctx.command('海龟汤 <action>', '海龟汤推理游戏')
    .action(async ({ session }, action) => {
      if (!session) return
      if (isPrivate(session) && !canPlayPrivate('turtleSoup')) {
        await session.send(d.game.disabled)
        return
      }
      const key = getSessionKey(session)
      const st = await getOrCreateState(key)
      if (checkGameRunning(st, 'turtleSoup')) {
        await session.send(d.common.gameRunning)
        return
      }
      if (action === '开始') {
        if (!cfg.turtleSoup.apiKey || !cfg.turtleSoup.model) {
          await session.send('请先配置海龟汤的 AI API 密钥和模型名称')
          return
        }
        await session.send(d.turtleSoup.generating)
        const generated = await generateTurtleSoup()
        if (!generated) {
          await session.send(d.turtleSoup.aiGenerationFailed)
          return
        }
        st.turtleSoup.started = true
        st.turtleSoup.currentRound = 1
        st.turtleSoup.storyContent = generated.story
        st.turtleSoup.storyAnswer = generated.answer
        st.turtleSoup.remainingQuestions = cfg.turtleSoup.maxQuestions
        st.turtleSoup.guessed = false
        await session.send(d.game.start.replace('{0}', String(st.turtleSoup.totalRounds)))
        await session.send(d.turtleSoup.story.replace('{0}', generated.story).replace('{1}', String(st.turtleSoup.remainingQuestions)))
        await saveGameState(key, st)
        setupAutoStop(session, st.turtleSoup, 'turtleSoup', cfg.turtleSoup.showRank, key)
      } else if (action === '结束') {
        clearGameData(st.turtleSoup, cfg.turtleSoup.showRank && !isPrivate(session), session)
        await session.send(d.game.stop)
        await saveGameState(key, st)
      } else {
        await session.send(d.game.usage.replace('{0}', '海龟汤 开始 | 海龟汤 结束'))
      }
    })
}