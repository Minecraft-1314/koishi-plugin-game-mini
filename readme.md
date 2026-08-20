
# koishi-plugin-game-mini

## 项目介绍 (Project Introduction)

### 中文
这是一款为 Koishi 聊天机器人框架开发的轻量级多功能小游戏插件，包含经典猜数字和海龟汤两款趣味游戏。游戏状态支持持久化保存，服务重启后未结束的游戏可以自动恢复。

### English
This is a lightweight, multi-functional mini-game plugin developed for the Koishi chatbot framework. It includes two fun games: Guess the Number and Turtle Soup. Game states are persistently saved, and unfinished games can be automatically restored after service restart.

## 使用说明 (Usage)

### 中文
| 命令 (Command) | 功能说明 (Description) |
| --- | --- |
| **猜数字游戏** | |
| `猜数字 开始` | 启动猜数字游戏，初始范围为配置的最小值-最大值 |
| 直接输入数字 | 游戏运行时输入纯数字即可猜测，系统会实时提示“猜大了/猜小了”并缩小范围，或提示“猜对了”并开始新回合 |
| `猜数字 结束` | 停止当前猜数字游戏 |
| **海龟汤** | |
| `海龟汤 开始` | 启动海龟汤推理游戏，AI 生成汤面，玩家提问或猜测答案 |
| 直接输入内容 | 游戏进行中可输入提问或直接猜测汤底，AI 主持人回复“是/不是/是或不是/不知道/不重要” |
| `海龟汤 结束` | 停止当前海龟汤游戏 |

### English
| Command | Description |
| --- | --- |
| **Number Guessing Game** | |
| `猜数字 开始` | Start the number guessing game with the initial range of configured min-max values |
| Enter number directly | Enter a pure number during the game to guess; the system will prompt "too big/too small" in real time and narrow the range, or prompt "correct" and start a new round |
| `猜数字 结束` | Stop the current number guessing game |
| **Turtle Soup** | |
| `海龟汤 开始` | Start the turtle soup reasoning game; AI generates a story, players ask questions or guess the answer |
| Enter content directly | During the game, type questions or guess the solution; the AI host responds "yes/no/yes or no/don't know/not important" |
| `海龟汤 结束` | Stop the current turtle soup game |

## 配置说明 (Configuration)

### 中文
| 配置项 | 说明 | 默认值 |
| --- | --- | --- |
| **游戏开关** | | |
| `enableNumberGuess` | 启用猜数字游戏 | true |
| `enableTurtleSoup` | 启用海龟汤游戏 | true |
| **私聊游戏开关** | | |
| `privateGame.enableNumberGuess` | 允许私聊玩猜数字 | true |
| `privateGame.enableTurtleSoup` | 允许私聊玩海龟汤 | true |
| **调试配置** | | |
| `debug.enableLog` | 启用调试日志输出 | false |
| **通用游戏消息配置** | | |
| `gameMessages.enabled` | 启用自定义通用消息 | true |
| `gameMessages.usage` | 用法错误提示 | "用法错误！正确用法：{0}" |
| `gameMessages.start` | 游戏开始提示 | "比赛开始！本次共 {0} 回合～" |
| `gameMessages.stop` | 游戏停止提示 | "比赛已停止" |
| `gameMessages.notStarted` | 游戏未开始提示 | "比赛尚未开始，请输入 {0} 开始 开始游戏" |
| `gameMessages.apiError` | API错误提示 | "API请求失败，请稍后再试" |
| `gameMessages.correct` | 答对提示 | "答对啦！你获得 {0} 分～" |
| `gameMessages.wrong` | 答错提示 | "答错啦～正确答案是：{0}，你不得分" |
| `gameMessages.roundEnd` | 回合结束提示 | "第 {0} 回合结束！剩余回合：{1}" |
| `gameMessages.gameEnd` | 游戏结束提示 | "比赛结束！" |
| `gameMessages.rankTitle` | 本局排行榜标题 | "本局排行榜" |
| `gameMessages.rankEmpty` | 本局排行榜为空提示 | "暂无参与记录～" |
| `gameMessages.disabled` | 功能禁用提示 | "该功能已关闭，请联系管理员开启" |
| `gameMessages.autoStop` | 自动停止提示 | "太久没人玩啦，比赛自动结束～" |
| **猜数字专用消息** | | |
| `guessNumberMessages.outOfRange` | 数字超出范围提示 | "数字超出当前范围 [{0}-{1}]，请重新输入！" |
| `guessNumberMessages.tooSmall` | 猜小了提示 | "猜小啦！当前范围更新为 [{0}-{1}]" |
| `guessNumberMessages.tooBig` | 猜大了提示 | "猜大啦！当前范围更新为 [{0}-{1}]" |
| `guessNumberMessages.correctDetail` | 猜中详细提示 | "恭喜你猜中数字！\n猜中者扣 {0} 分，其他玩家各加 {1} 分" |
| **海龟汤专用消息** | | |
| `turtleSoupMessages.story` | 汤面展示 | "汤面：{0}\n发送你的问题或猜测，主持人会回答你。\n剩余提问次数：{1}" |
| `turtleSoupMessages.guessCorrect` | 猜中提示 | "恭喜你猜中了！汤底：{0}" |
| `turtleSoupMessages.noMoreQuestions` | 无提问次数提示 | "提问次数已用完！汤底：{0}" |
| `turtleSoupMessages.aiGenerationFailed` | AI生成失败提示 | "AI生成海龟汤失败，请稍后重试" |
| `turtleSoupMessages.generating` | 生成中提示 | "正在生成海龟汤，请稍候..." |
| **通用消息配置** | | |
| `commonMessages.gameRunning` | 游戏运行中提示 | "当前已有游戏在运行中，请先结束当前游戏后再开始新游戏！" |
| `commonMessages.paramError` | 参数错误提示 | "参数错误！请检查输入格式" |
| **猜数字游戏配置** | | |
| `guessNumber.min` | 最小值 | 0 |
| `guessNumber.max` | 最大值 | 100 |
| `guessNumber.botParticipateInGroup` | 群聊中机器人是否参与 | true |
| `guessNumber.totalRounds` | 总回合数 | 10 |
| `guessNumber.showRank` | 游戏结束后显示本局排行榜 | true |
| `guessNumber.autoPlayDelay` | 机器人自动操作延迟（秒） | 10 |
| `guessNumber.autoPlayMaxCount` | 机器人最大自动操作次数 | 5 |
| `guessNumber.autoStopInactiveTime` | 游戏无操作自动停止时间（秒） | 60 |
| `guessNumber.enablePenalty` | 启用惩罚机制（猜中者扣分，其他人加分） | true |
| `guessNumber.penaltyScore` | 猜中者扣除分数 | -1 |
| `guessNumber.rewardScore` | 其他人奖励分数 | 1 |
| **海龟汤配置** | | |
| `turtleSoup.totalRounds` | 总回合数 | 3 |
| `turtleSoup.showRank` | 游戏结束后显示本局排行榜 | true |
| `turtleSoup.maxQuestions` | 每回合最大提问次数 | 50 |
| `turtleSoup.autoStopInactiveTime` | 游戏无操作自动停止时间（秒） | 120 |
| `turtleSoup.rewardScore` | 猜对奖励分数 | 3 |
| `turtleSoup.apiEndpoint` | AI API 地址 | `https://api.openai.com/v1` |
| `turtleSoup.apiKey` | AI API 密钥 | (空) |
| `turtleSoup.model` | AI 模型 | (空) |
| **API接口配置** | | |
| `apiConfig.timeout` | API请求超时时间（毫秒，0为不超时） | 30000 |

### English
| Config Item | Description | Default |
| --- | --- | --- |
| **Game Switches** | | |
| `enableNumberGuess` | Enable number guessing game | true |
| `enableTurtleSoup` | Enable turtle soup game | true |
| **Private Chat Switches** | | |
| `privateGame.enableNumberGuess` | Allow private chat for number guessing | true |
| `privateGame.enableTurtleSoup` | Allow private chat for turtle soup | true |
| **Debug Configuration** | | |
| `debug.enableLog` | Enable debug log output | false |
| **Common Game Messages Configuration** | | |
| `gameMessages.enabled` | Enable custom common messages | true |
| `gameMessages.usage` | Usage error prompt | "Usage error! Correct usage: {0}" |
| `gameMessages.start` | Game start prompt | "Game starts! Total {0} rounds～" |
| `gameMessages.stop` | Game stop prompt | "Game stopped" |
| `gameMessages.notStarted` | Game not started prompt | "Game not started yet, please enter {0} start to begin" |
| `gameMessages.apiError` | API error prompt | "API request failed, please try again later" |
| `gameMessages.correct` | Correct answer prompt | "Correct! You get {0} points～" |
| `gameMessages.wrong` | Wrong answer prompt | "Wrong～The correct answer is: {0}, you get no points" |
| `gameMessages.roundEnd` | Round end prompt | "Round {0} ends! Remaining rounds: {1}" |
| `gameMessages.gameEnd` | Game end prompt | "Game Over!" |
| `gameMessages.rankTitle` | Round rank title | "Round Ranking" |
| `gameMessages.rankEmpty` | Round rank empty prompt | "No participants～" |
| `gameMessages.disabled` | Disabled prompt | "This feature is disabled, please contact administrator" |
| `gameMessages.autoStop` | Auto stop prompt | "Too long no activity, game auto ended～" |
| **Number Guessing Specific Messages** | | |
| `guessNumberMessages.outOfRange` | Number out of range prompt | "Number out of current range [{0}-{1}], please enter again!" |
| `guessNumberMessages.tooSmall` | Too small prompt | "Too small! Current range updated to [{0}-{1}]" |
| `guessNumberMessages.tooBig` | Too big prompt | "Too big! Current range updated to [{0}-{1}]" |
| `guessNumberMessages.correctDetail` | Correct detail prompt | "Congratulations on guessing the number!\nGuesser loses {0} points, other players each gain {1} points" |
| **Turtle Soup Specific Messages** | | |
| `turtleSoupMessages.story` | Story display | "Story: {0}\nSend your questions or guesses, the host will answer you.\nRemaining questions: {1}" |
| `turtleSoupMessages.guessCorrect` | Guessed correctly prompt | "Congratulations! The answer is: {0}" |
| `turtleSoupMessages.noMoreQuestions` | No more questions prompt | "No more questions! The answer is: {0}" |
| `turtleSoupMessages.aiGenerationFailed` | AI generation failed | "AI failed to generate turtle soup, please try again later" |
| `turtleSoupMessages.generating` | Generating prompt | "Generating turtle soup, please wait..." |
| **Common Messages Configuration** | | |
| `commonMessages.gameRunning` | Game running prompt | "A game is already running, please end it first before starting a new one!" |
| `commonMessages.paramError` | Parameter error prompt | "Parameter error! Please check input format" |
| **Number Guessing Configuration** | | |
| `guessNumber.min` | Minimum value | 0 |
| `guessNumber.max` | Maximum value | 100 |
| `guessNumber.botParticipateInGroup` | Whether bot participates in group | true |
| `guessNumber.totalRounds` | Total rounds | 10 |
| `guessNumber.showRank` | Show rank after game ends | true |
| `guessNumber.autoPlayDelay` | Bot auto operation delay (seconds) | 10 |
| `guessNumber.autoPlayMaxCount` | Bot maximum auto operation count | 5 |
| `guessNumber.autoStopInactiveTime` | Auto stop time due to inactivity (seconds) | 60 |
| `guessNumber.enablePenalty` | Enable penalty mechanism (guesser loses points, others gain) | true |
| `guessNumber.penaltyScore` | Points deducted from guesser | -1 |
| `guessNumber.rewardScore` | Points rewarded to others | 1 |
| **Turtle Soup Configuration** | | |
| `turtleSoup.totalRounds` | Total rounds | 3 |
| `turtleSoup.showRank` | Show rank after game ends | true |
| `turtleSoup.maxQuestions` | Max questions per round | 50 |
| `turtleSoup.autoStopInactiveTime` | Auto stop time due to inactivity (seconds) | 120 |
| `turtleSoup.rewardScore` | Reward score for correct guess | 3 |
| `turtleSoup.apiEndpoint` | AI API endpoint | `https://api.openai.com/v1` |
| `turtleSoup.apiKey` | AI API key | (empty) |
| `turtleSoup.model` | AI model | (empty) |
| **API Configuration** | | |
| `apiConfig.timeout` | API request timeout (milliseconds, 0 for no timeout) | 30000 |

## 项目贡献者 (Contributors)
| 贡献者 | 贡献内容 |
| --- | --- |
| Minecraft-1314 | 插件完整开发 |
| 慕名API | 慕名API 支持 |
| 月下独酌API | 月下独酌API 支持 |
| （欢迎提交 PR 加入贡献者列表） | |

## 许可协议 (License)
本项目采用 MIT 开源许可证，您可自由使用、修改和分发，详情参见项目根目录的 LICENSE 文件。

This project is licensed under the MIT Open Source License. You are free to use, modify and distribute it. For details, see the LICENSE file in the project root directory.

## 支持我们 (Support Us)
如果这个项目对您有帮助，欢迎点亮仓库右上角的 Star ⭐ 支持我们，这将是对所有贡献者最大的鼓励！

If this project is helpful to you, please feel free to star the repository in the upper right corner ⭐ to support us, which will be the greatest encouragement to all contributors!