// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import { getDatabase, ref, set, push, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js"; // 引入 Realtime Database 相關模組

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBFzyxe1dQjHJcnbi322RJ5ARoQaNJ56xI",
    authDomain: "final-project-2f944.firebaseapp.com",
    databaseURL: "https://final-project-2f944-default-rtdb.firebaseio.com",
    projectId: "final-project-2f944",
    storageBucket: "final-project-2f944.firebasestorage.app",
    messagingSenderId: "382063694746",
    appId: "1:382063694746:web:85f49c31c0348e93d4a023",
    measurementId: "G-5JQ18KMJC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app); // 取得 Realtime Database 實例

// 獲取遊戲相關的 DOM 元素
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const livesContainer = document.getElementById('lives-container'); // 新增
const livesDisplay = document.getElementById('lives'); // 這裡仍然指向 span
const questionArea = document.getElementById('question-area');
// 障礙物圖片列表
const obstacleImages = [
    './images/obstacle1.png',
    './images/obstacle2.png',
    './images/obstacle3.png',
    // 根據您準備的圖片數量，繼續添加 'images/obstacle4.png' 等
];
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const optionButtons = document.querySelectorAll('.option-btn'); // 獲取所有答案按鈕
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const playerNameInput = document.getElementById('player-name');
const submitScoreBtn = document.getElementById('submit-score-btn');
const restartGameBtn = document.getElementById('restart-game-btn');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const leaderboardList = document.getElementById('leaderboard-list');
const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
const startScreen = document.getElementById('start-screen');
const startGameBtn = document.getElementById('start-game-btn');
const gameContainer = document.getElementById('game-container');
const winScreen = document.getElementById('win-screen');
const winFinalScoreDisplay = document.getElementById('win-final-score');
const restartGameWinBtn = document.getElementById('restart-game-win-btn');
const showLeaderboardWinBtn = document.getElementById('show-leaderboard-win-btn');
const playerNameInputWin = document.getElementById('player-name-win');
const submitScoreWinBtn = document.getElementById('submit-score-win-btn');

// 定義一些遊戲變數
let score = 0;
let lives = 3;
let isJumping = false;
let playerBottom = 50; // 玩家的初始底部位置
let playerLeft = 100; // 玩家的初始左側位置
let gravity = 1.2; // 重力效果
let jumpVelocity = 25; // 初始跳躍速度
let verticalVelocity = 0; // 垂直速度
let gameInterval; // 用於存儲遊戲主迴圈的 setInterval ID
let obstacleTimer; // 用於存儲障礙物生成的 setInterval ID
let isGameOver = false;
const WINNING_SCORE = 100; // 設定一個勝利分數閾值，您可以根據遊戲難度調整
let questionActive = false; // 判斷是否有題目正在顯示
let availableQuestions = []; 
let backgroundPositionX = 0; // 背景圖片的 X 軸位置
const backgroundScrollSpeed = 2.5; // 背景捲動速度 (像素/幀)
const horizontalTolerance = 10; 
const verticalTolerance = 5; 


// 難度漸進相關變數
let currentObstacleSpeed = 9; // 初始障礙物速度
let initialObstacleGenerationInterval = 1200; // 初始障礙物生成間隔 (毫秒)
let minObstacleGenerationInterval = 500; // 最小障礙物生成間隔 (毫秒)
const difficultyIncreaseScoreInterval = 10; // 每累積多少分數提升一次難度
const speedIncreaseAmount = 0.8; // 每次提升難度時速度增加多少
const intervalDecreaseAmount = 80; // 每次提升難度時生成間隔減少多少 (毫秒)

// 用於追蹤上次提升難度時的分數
let lastDifficultyIncreaseScore = 0;

// 程式題庫 (請盡情擴充！)
const questions = [
    {
        question: "在 JavaScript 中，宣告變數的關鍵字是？",
        options: ["A. var", "B. const", "C. let", "D. 以上皆是"],
        answer: "D"
    },
    {
        question: "以下哪一個是 HTML 標籤？",
        options: ["A. <style>", "B. .class", "C. #id", "D. function"],
        answer: "A"
    },
    {
        question: "CSS 用來做什麼？",
        options: ["A. 程式邏輯", "B. 網頁內容", "C. 網頁樣式", "D. 資料庫管理"],
        answer: "C"
    },
    {
        question: "哪種資料庫適合實時排行榜？",
        options: ["A. MySQL", "B. PostgreSQL", "C. Firebase Realtime Database", "D. MongoDB"],
        answer: "C"
    },
    {
        question: "在 JavaScript 中，如何判斷變數 'x' 的資料類型是否為數字？",
        options: ["A. typeof x === 'number'", "B. x.isNumber()", "C. isNaN(x)", "D. x instanceof Number"],
        answer: "A"
    },
    {
        question: "要讓網頁元素在點擊時執行 JavaScript 程式碼，應使用哪個 HTML 屬性？",
        options: ["A. href", "B. src", "C. onclick", "D. style"],
        answer: "C"
    },
    {
        question: "在 CSS 中，哪個屬性用於控制文字顏色？",
        options: ["A. background-color", "B. color", "C. font-color", "D. text-style"],
        answer: "B"
    },
    {
        question: "以下哪個不是有效的 CSS 選擇器？",
        options: ["A. #myId", "B. .myClass", "C. div:hover", "D. @media"],
        answer: "D"
    },
    {
        question: "在 JavaScript 中，如何從陣列 [1, 2, 3] 中移除元素 2？",
        options: ["A. array.remove(2)", "B. array.splice(1, 1)", "C. array.delete(2)", "D. array.pop(2)"],
        answer: "B"
    },
    {
        question: "以下哪種是 JavaScript 的迴圈語句？",
        options: ["A. while", "B. for", "C. do...while", "D. 以上皆是"],
        answer: "D"
    },
    {
        question: "在 HTML 中，用於嵌入圖片的標籤是？",
        options: ["A. <video>", "B. <img>", "C. <picture>", "D. <audio>"],
        answer: "B"
    },
    {
        question: "要讓 HTML 元素置中對齊，在 CSS 中常用的屬性組合是？",
        options: ["A. display: block; margin: auto;", "B. text-align: center;", "C. position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);", "D. 以上皆是 (取決於情況)"],
        answer: "D"
    },
    {
        question: "Firebase Realtime Database 中，讀取資料的事件監聽器通常是？",
        options: ["A. onUpdate", "B. onRead", "C. onValue", "D. onData"],
        answer: "C"
    },
    {
        question: "運算思維的四個主要支柱不包含以下哪項？",
        options: ["A. 分解 (Decomposition)", "B. 模式識別 (Pattern Recognition)", "C. 抽象化 (Abstraction)", "D. 實體化 (Instantiation)"],
        answer: "D"
    },
    {
        question: "在 HTML 中，用來建立超連結的標籤是？",
        options: ["A. <link>", "B. <href>", "C. <a>", "D. <url>"],
        answer: "C"
    },
    {
        question: "HTML 文件中，用於定義網頁標題的標籤是？",
        options: ["A. <body>", "B. <head>", "C. <title>", "D. <header>"],
        answer: "C"
    },
    {
        question: "在 HTML 表單中，用於定義輸入欄位的標籤是？",
        options: ["A. <button>", "B. <submit>", "C. <input>", "D. <form>"],
        answer: "C"
    },
    {
        question: "以下哪個 HTML 標籤用於顯示無序列表？",
        options: ["A. <ol>", "B. <li>", "C. <ul>", "D. <dl>"],
        answer: "C"
    },
    {
        question: "要讓圖片在網頁上顯示，需使用哪個 HTML 標籤？",
        options: ["A. <pic>", "B. <img src=''>", "C. <image>", "D. <picture>"],
        answer: "B"
    },
    {
        question: "在 CSS 中，哪個屬性用於設定元素的背景顏色？",
        options: ["A. text-color", "B. color", "C. background-color", "D. fill-color"],
        answer: "C"
    },
    {
        question: "要讓 CSS 樣式作用於多個具有相同特徵的元素，應使用哪種選擇器？",
        options: ["A. ID 選擇器", "B. 類別 (Class) 選擇器", "C. 元素選擇器", "D. 屬性選擇器"],
        answer: "B"
    },
    {
        question: "在 CSS 盒模型中，由內而外依序為：內容區、內邊距、邊框、外邊距，英文縮寫依序為？",
        options: ["A. Content, Padding, Border, Margin", "B. Margin, Border, Padding, Content", "C. Content, Border, Padding, Margin", "D. Padding, Content, Border, Margin"],
        answer: "A"
    },
    {
        question: "要改變一個元素的字體大小，應使用哪個 CSS 屬性？",
        options: ["A. font-style", "B. text-size", "C. font-weight", "D. font-size"],
        answer: "D"
    },
    {
        question: "在 CSS 中，將元素的顯示方式設定為 'display: flex;' 的目的是？",
        options: ["A. 使元素隱藏", "B. 使元素水平排列並控制對齊方式", "C. 使元素垂直排列", "D. 設定元素的字體樣式"],
        answer: "B"
    },
    {
        question: "在 JavaScript 中，如何將一個字串轉換為數字？",
        options: ["A. toString()", "B. parseInt()", "C. toNumber()", "D. formatNumber()"],
        answer: "B"
    },
    {
        question: "JavaScript 中，用於在控制台輸出訊息的語法是？",
        options: ["A. print()", "B. log()", "C. console.log()", "D. alert()"],
        answer: "C"
    },
    {
        question: "以下哪一個是 JavaScript 中用於比較兩個值是否相等且類型也相等的運算符？",
        options: ["A. ==", "B. =", "C. ===", "D. !="],
        answer: "C"
    },
    {
        question: "在 JavaScript 中，如何宣告一個函數？",
        options: ["A. new function()", "B. function myFunction()", "C. define function myFunction()", "D. var function = myFunction()"],
        answer: "B"
    },
    {
        question: "JavaScript 中，哪個方法用於在指定時間後執行一次函數？",
        options: ["A. setInterval()", "B. setTimeout()", "C. loop()", "D. delay()"],
        answer: "B"
    },
    {
        question: "將一個複雜問題拆解成許多小問題，這是運算思維中的哪一個步驟？",
        options: ["A. 模式識別", "B. 抽象化", "C. 分解", "D. 演算法設計"],
        answer: "C"
    },
    {
        question: "在程式設計中，重複執行特定程式碼區塊直到滿足某個條件為止，這是哪種控制結構？",
        options: ["A. 順序", "B. 選擇", "C. 迴圈", "D. 函數"],
        answer: "C"
    },
    {
        question: "當程式碼執行時，如果某個條件成立就執行 A 區塊，否則執行 B 區塊，這屬於哪種程式設計概念？",
        options: ["A. 迴圈", "B. 函式", "C. 條件判斷", "D. 變數宣告"],
        answer: "C"
    },
    {
        question: "一個能解決問題的、步驟清晰且有限的指令集，稱為？",
        options: ["A. 程式碼", "B. 數據", "C. 演算法", "D. 變數"],
        answer: "C"
    },
    {
        question: "在遊戲開發中，將角色、障礙物、分數等抽象成程式碼中的物件或變數，這屬於運算思維中的哪項？",
        options: ["A. 分解", "B. 模式識別", "C. 抽象化", "D. 演算法設計"],
        answer: "C"
    }
];

let currentQuestion = null; // 當前顯示的問題
let currentObstacle = null; // 當前觸發問題的障礙物

// 音效物件
const jumpSound = new Audio('./audio/jump.mp3'); // 確保路徑正確
const correctSound = new Audio('./audio/correct.mp3');
const wrongSound = new Audio('./audio/wrong.mp3');
wrongSound.volume = 0.5;

// 背景音樂 (音量可以根據需求調整)
const backgroundMusic = new Audio('./audio/bgm.mp3');
backgroundMusic.loop = true; // 設置循環播放
backgroundMusic.volume = 0.3; // 調整背景音樂音量，通常比音效小


function drawHearts() {
    livesDisplay.innerHTML = ''; // 清空舊的愛心
    for (let i = 0; i < lives; i++) {
        const heart = document.createElement('div');
        heart.classList.add('heart-icon'); // 添加我們在 CSS 中定義的類別
        livesDisplay.appendChild(heart);
    }
}

// 初始化遊戲狀態
function startGame() {
    startScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    backgroundMusic.play().catch(e => console.log("背景音樂播放失敗:", e));

    score = 0;
    lives = 3;
    playerBottom = 50;
    playerLeft = 100;
    isJumping = false;
    isGameOver = false;
    questionActive = false;
    availableQuestions = questions.slice();
    shuffleArray(availableQuestions);

    scoreDisplay.textContent = `分數：${score}`;
    // 這裡不再直接顯示數字生命值，而是呼叫 drawHearts
    drawHearts(); // 遊戲開始時繪製初始生命值愛心

    player.style.bottom = `${playerBottom}px`;

    player.style.left = `${playerLeft}px`;
    player.style.backgroundImage = 'url("../images/Hero_normal.png")';

    const obstacles = document.querySelectorAll('.obstacle');
    obstacles.forEach(obstacle => obstacle.remove());

    questionArea.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    winScreen.classList.add('hidden'); // ***新增這行，隱藏勝利畫面***

    if (gameInterval) clearInterval(gameInterval);
    if (obstacleTimer) clearInterval(obstacleTimer);
    currentObstacleSpeed = 9;
    lastDifficultyIncreaseScore = 0;
    jumpVelocity = 25; // 重置為新的初始跳躍速度
    gravity = 1.2; // 重置為新的初始重力
    initialObstacleGenerationInterval = 1200;

    gameInterval = setInterval(gameLoop, 20);
    obstacleTimer = setInterval(generateObstacle, initialObstacleGenerationInterval);
}

// 玩家跳躍功能
function jump() {
    if (!isJumping && !isGameOver && !questionActive) {
        isJumping = true;
        verticalVelocity = jumpVelocity;

        // >>> 確保這行是切換到跳躍圖片 <<<
        player.style.backgroundImage = 'url("../images/Hero_jump.png")';
        jumpSound.currentTime = 0; // 重置音效，確保每次都能從頭播放
        jumpSound.play();
    }
}

// 遊戲主迴圈
function gameLoop() {
    if (isGameOver || questionActive) return;

    backgroundPositionX -= backgroundScrollSpeed;
    gameArea.style.backgroundPositionX = `${backgroundPositionX}px`;

     // 更新玩家的垂直位置 (跳躍/重力)
    if (isJumping) {
        playerBottom += verticalVelocity;
        verticalVelocity -= gravity;

        if (playerBottom <= 50) {
            playerBottom = 50;
            isJumping = false;
            verticalVelocity = 0;
            player.style.backgroundImage = 'url("../images/Hero_normal.png")';
        }
        player.style.bottom = `${playerBottom}px`;
    } else {
        if (player.style.backgroundImage.includes('Hero_jump.png')) {
            player.style.backgroundImage = 'url("../images/Hero_normal.png")';
        }
    }

    if (score >= lastDifficultyIncreaseScore + difficultyIncreaseScoreInterval) {
        lastDifficultyIncreaseScore = score;

        // 提升障礙物速度
        currentObstacleSpeed += speedIncreaseAmount;
        console.log(`--- 難度提升！目前分數: ${score} ---`);
        console.log(`新障礙物速度：${currentObstacleSpeed.toFixed(1)}`);

        // 縮短障礙物生成間隔 (但不要低於最小值)
        const newInterval = Math.max(minObstacleGenerationInterval, initialObstacleGenerationInterval - (currentObstacleSpeed - 9) * (intervalDecreaseAmount / speedIncreaseAmount));

        if (newInterval < initialObstacleGenerationInterval) {
            clearInterval(obstacleTimer);
            obstacleTimer = setInterval(generateObstacle, newInterval);
            initialObstacleGenerationInterval = newInterval; // 更新為當前的生成間隔
            console.log(`新障礙物生成間隔：${newInterval}ms`);
        } else {
            console.log(`障礙物生成間隔已達最小值或不再減少: ${initialObstacleGenerationInterval}ms`);
        }

        // *** 調整玩家跳躍和重力，讓後期動作更快更靈敏 ***
        jumpVelocity += jumpSpeedIncrease;
        gravity += gravityIncrease;

        console.log(`新跳躍速度：${jumpVelocity.toFixed(1)}，新重力：${gravity.toFixed(2)}`);
    }
    const obstacles = document.querySelectorAll('.obstacle');
    obstacles.forEach(obstacle => {
        let obstacleLeft = parseFloat(obstacle.style.left);
        obstacleLeft -= currentObstacleSpeed;
        obstacle.style.left = `${obstacleLeft}px`;

        if (obstacleLeft < -50) {
            obstacle.remove();
            score++;
            scoreDisplay.textContent = `分數：${score}`;
        }

        const playerRect = player.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect();

        if (
            playerRect.left < obstacleRect.right - horizontalTolerance &&
            playerRect.right > obstacleRect.left + horizontalTolerance &&
            playerRect.bottom > obstacleRect.top + verticalTolerance &&
            playerRect.top < obstacleRect.bottom - verticalTolerance
        ) {
            if (!questionActive && obstacle.dataset.questionTriggered === 'false') {
                currentObstacle = obstacle;
                showQuestion();
                obstacle.dataset.questionTriggered = 'true';
            }
        }
    });
    checkGameOver();
}

// 生成障礙物
function generateObstacle() {
    if (isGameOver || questionActive) return;

    const obstacles = document.querySelectorAll('.obstacle'); // 獲取所有現有障礙物
    let lastObstacleRight = 0; // 追蹤畫面上最右側障礙物的右邊界

    if (obstacles.length > 0) {
        // 找到目前畫面上最右邊的障礙物。
        // 因為它們是從右邊生成並向左移動，所以陣列中通常最靠右的就是最後一個（索引最大）。
        const rightmostObstacle = obstacles[obstacles.length - 1]; // 假設是最後一個
        // 獲取其右邊界位置 (left + width)
        // 注意：offsetWidth 是一個更可靠的獲取元素寬度的方法，它會考慮到 CSS 邊框等。
        lastObstacleRight = parseFloat(rightmostObstacle.style.left) + rightmostObstacle.offsetWidth;
        // 如果 rightmostObstacle.offsetWidth 無法立即取得正確值，確保障礙物在 CSS 中有固定寬度
        // 或者可以在生成 obstacle 時，暫時設定一個寬度，例如：obstacle.style.width = '80px';
    }

    // 最小間隔像素，可以調整，確保視覺上不會重疊
    const minGap = 250; // 增加這個值，讓障礙物之間有更明顯的距離


    // 計算新障礙物的生成位置
    // 新障礙物的起始位置應該在 gameArea.clientWidth (螢幕右邊界) 和 (最右邊障礙物右邊界 + 最小間隔) 的最大值
    let spawnPosition = Math.max(gameArea.clientWidth, lastObstacleRight + minGap);

    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    obstacle.dataset.questionTriggered = 'false';

    const randomIndex = Math.floor(Math.random() * obstacleImages.length);
    const selectedImage = obstacleImages[randomIndex];
    obstacle.style.backgroundImage = `url('${selectedImage}')`;

    // 隨機障礙物高度
    const minObstacleHeight = 80;
    const maxObstacleHeight = 80;
    obstacle.style.height = `${Math.random() * (maxObstacleHeight - minObstacleHeight) + minObstacleHeight}px`;

    obstacle.style.left = `${spawnPosition}px`; // 使用計算出的生成位置
    obstacle.style.bottom = `50px`;

    gameArea.appendChild(obstacle);
}

// 顯示題目
function showQuestion() {
    questionActive = true; // 設置題目為活躍狀態，暫停遊戲邏輯

    if (availableQuestions.length === 0) {
        // 如果所有問題都問完了，重新填充並打亂
        availableQuestions = questions.slice();
        shuffleArray(availableQuestions);
        console.log("所有問題都已問過，題庫已重新填充並打亂。");
    }

    // 隨機選擇一道題目
    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];

    availableQuestions.splice(randomIndex, 1);

    questionText.textContent = currentQuestion.question; // 顯示問題

    // 顯示答案選項
    optionsContainer.innerHTML = ''; // 清空舊的選項
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.classList.add('option-btn');
        button.textContent = option;
        button.dataset.answer = String.fromCharCode(65 + index); // 將 A, B, C, D 賦予給按鈕的 data-answer
        button.addEventListener('click', handleAnswer); // 監聽按鈕點擊事件
        optionsContainer.appendChild(button);
    });

    questionArea.classList.remove('hidden'); // 顯示題目區
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 交換元素
    }
}

// 處理答案選擇
function handleAnswer(event) {
    const selectedAnswer = event.target.dataset.answer;

    if (selectedAnswer === currentQuestion.answer) {
        score += 10;
        scoreDisplay.textContent = `分數：${score}`;
        console.log("答案正確！");
        correctSound.currentTime = 0;
        correctSound.play();
        // 如果 currentObstacle 存在，答對後移除它
        if (currentObstacle) {
            currentObstacle.remove();
            currentObstacle = null;
        }
    } else {
        lives--;
        // 修改這裡：答錯後減少生命值，然後重新繪製愛心
        // livesDisplay.textContent = `生命：${lives}`; // 這行可以移除
        drawHearts(); // 重新繪製愛心圖示
        console.log("答案錯誤！生命值 -1");
        wrongSound.currentTime = 0;
        wrongSound.play();
        if (currentObstacle) {
            currentObstacle.remove();
            currentObstacle = null;
        }
    }

    questionArea.classList.add('hidden'); // 隱藏題目區
    questionActive = false; // 題目不再活躍，遊戲可以繼續
    checkGameOver(); // 檢查遊戲是否結束
}

// 檢查遊戲是否結束
function checkGameOver() {
    // 優先判斷是否達到勝利分數
    if (score >= WINNING_SCORE) {
        isGameOver = true;
        clearInterval(gameInterval);
        clearInterval(obstacleTimer);

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        winFinalScoreDisplay.textContent = score;
        winScreen.classList.remove('hidden'); // 顯示勝利畫面
        gameOverScreen.classList.add('hidden'); // 隱藏遊戲結束畫面
        leaderboardScreen.classList.add('hidden');
    }
    // 然後再判斷生命值是否歸零 (只有在還沒勝利的情況下才判斷)
    else if (lives <= 0) {
        isGameOver = true;
        clearInterval(gameInterval);
        clearInterval(obstacleTimer);

        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden'); // 顯示遊戲結束畫面
        leaderboardScreen.classList.add('hidden');
        winScreen.classList.add('hidden'); // 確保勝利畫面隱藏
    }
}
// 修改 submitScore 函數，接受 player name 作為參數
function submitScore(sourceScreen) { // sourceScreen 可以是 'gameOver' 或 'win'
    let playerName = '';
    if (sourceScreen === 'gameOver') {
        playerName = playerNameInput.value.trim();
    } else if (sourceScreen === 'win') {
        playerName = playerNameInputWin.value.trim();
    }

    if (playerName === "") {
        alert("請輸入您的名字！");
        return;
    }

    const scoresRef = ref(database, 'scores');

    push(scoresRef, {
        name: playerName,
        score: score,
        timestamp: Date.now()
    })
        .then(() => {
            alert("分數提交成功！");
            // 清空輸入框
            if (sourceScreen === 'gameOver') {
                playerNameInput.value = "";
            } else if (sourceScreen === 'win') {
                playerNameInputWin.value = "";
            }

            gameOverScreen.classList.add('hidden'); // 隱藏遊戲結束畫面
            winScreen.classList.add('hidden'); // 隱藏勝利畫面
            showLeaderboard(); // 提交成功後顯示排行榜
        })
        .catch((error) => {
            console.error("分數提交失敗：", error);
            alert("分數提交失敗，請稍後再試。");
        });
}
// 顯示排行榜
function showLeaderboard() {
    leaderboardList.innerHTML = ''; // 清空舊的排行榜列表

    // 取得 'scores' 路徑的引用
    const scoresRef = ref(database, 'scores');

    // 查詢分數，按分數降序排序，並只取前 10 名
    const topScoresQuery = query(scoresRef, orderByChild('score'), limitToLast(10));

    // 監聽數據變化 (onValue 會在初始化時和數據有變化時觸發)
    onValue(topScoresQuery, (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push(childSnapshot.val()); // 將每個分數記錄添加到陣列中
        });

        // Firebase 的 orderByChild + limitToLast 是取最後 N 個，所以是分數最低的 N 個。
        // 我們需要反轉陣列並再次排序，才能得到分數最高的 N 個。
        scores.sort((a, b) => b.score - a.score); // 按分數降序排序

        if (scores.length === 0) {
            const li = document.createElement('li');
            li.textContent = "目前沒有任何分數記錄。";
            leaderboardList.appendChild(li);
        } else {
            scores.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${index + 1}. ${entry.name}</span><span>${entry.score}</span>`;
                leaderboardList.appendChild(li);
            });
        }

        gameOverScreen.classList.add('hidden'); // 隱藏遊戲結束畫面
        questionArea.classList.add('hidden'); // 確保題目區也隱藏
        leaderboardScreen.classList.remove('hidden'); // 顯示排行榜畫面
    }, {
        onlyOnce: false // 保持監聽，當資料庫更新時會自動重新載入
    });
}


// 監聽空白鍵事件
document.addEventListener('keydown', (event) => {
    // 檢查是否按下了空白鍵 (keyCode 32 或 event.code 'Space')
    if (event.code === 'Space') { // 或者 event.keyCode === 32
        jump(); // 調用跳躍函數 [cite: 4]
    }
});

// 綁定重新挑戰按鈕事件
restartGameBtn.addEventListener('click', startGame);

// 綁定提交分數按鈕事件
console.log("Submit Score Button:", submitScoreBtn);
submitScoreBtn.addEventListener('click', () => submitScore('gameOver')); // 傳遞 'gameOver'
submitScoreWinBtn.addEventListener('click', () => submitScore('win')); // 傳遞 'win'
startGameBtn.addEventListener('click', startGame);

// ... (其他現有事件綁定)

// 綁定勝利畫面的「再次挑戰」按鈕事件
restartGameWinBtn.addEventListener('click', startGame);

// 綁定勝利畫面的「查看英雄榜」按鈕事件
showLeaderboardWinBtn.addEventListener('click', showLeaderboard);


// 綁定關閉排行榜按鈕事件
closeLeaderboardBtn.addEventListener('click', () => {
    leaderboardScreen.classList.add('hidden'); // 隱藏排行榜

    // 無論遊戲是結束還是勝利後查看的排行榜，都回到初始畫面
    startScreen.classList.remove('hidden'); // 顯示開始畫面
    gameContainer.classList.add('hidden'); // 隱藏遊戲容器
    gameOverScreen.classList.add('hidden'); // 確保遊戲結束畫面隱藏
    winScreen.classList.add('hidden'); // 確保勝利畫面隱藏

    // 同時停止背景音樂，讓它回到初始狀態
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

    // 清除任何可能殘留的遊戲計時器，以防萬一
    if (gameInterval) clearInterval(gameInterval);
    if (obstacleTimer) clearInterval(obstacleTimer);
});

// 在頁面載入完成後不直接啟動遊戲，而是先顯示開始畫面
document.addEventListener('DOMContentLoaded', () => {
    // 確保初始狀態是顯示開始畫面，隱藏遊戲容器
    startScreen.classList.remove('hidden');
    gameContainer.classList.add('hidden'); // 如果 game-container 預設沒有 hidden，這裡需要添加
    // 但我們在 HTML 中已經給 game-container 添加了 hidden class，所以這行可以省略
});
