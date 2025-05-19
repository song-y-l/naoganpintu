const puzzleContainer = document.getElementById('puzzle-container');
const startButton = document.getElementById('start-button');
const imageSrc = 'your-image.jpg'; // 替换成你的图片路径
const rows = 3;
const cols = 3;
let puzzlePieces = [];
let image = new Image();
let containerWidth, containerHeight, pieceWidth, pieceHeight;

image.onload = () => {
    containerWidth = puzzleContainer.offsetWidth;
    containerHeight = puzzleContainer.offsetHeight;
    pieceWidth = containerWidth / cols;
    pieceHeight = containerHeight / rows;

    // 设置 Grid 布局
    puzzleContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    createPieces(); // 图片加载完成后创建拼图块
};

image.src = imageSrc; // 开始加载图片

function createPieces() {
    puzzlePieces = []; // 重置
    puzzleContainer.innerHTML = ''; // 清空容器

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const pieceIndex = i * cols + j;

            // 方法1: 使用 div 和 background-image (需要复杂计算 background-position)
            /*
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece');
            piece.style.width = `${pieceWidth}px`;
            piece.style.height = `${pieceHeight}px`;
            piece.style.backgroundImage = `url('${imageSrc}')`;
            // 计算正确的背景位置，使得这块div显示原图的对应部分
            piece.style.backgroundPosition = `-${j * pieceWidth}px -${i * pieceHeight}px`;
            piece.dataset.correctPosition = pieceIndex; // 存储正确位置的索引
            piece.draggable = true;
            */

            // 方法2: 使用 Canvas 绘制 (更精确)
            const canvas = document.createElement('canvas');
            canvas.width = pieceWidth;
            canvas.height = pieceHeight;
            const ctx = canvas.getContext('2d');
            // 绘制原图的 (j*pieceWidth, i*pieceHeight) 到 (j*pieceWidth + pieceWidth, i*pieceHeight + pieceHeight)
            // 到小canvas的 (0,0) 到 (pieceWidth, pieceHeight)
            ctx.drawImage(image,
                          j * pieceWidth, i * pieceHeight, pieceWidth, pieceHeight,
                          0, 0, pieceWidth, pieceHeight);

            const piece = document.createElement('div'); // 用一个div包裹canvas，方便样式和拖拽
            piece.classList.add('puzzle-piece');
            piece.appendChild(canvas); // 将canvas放入div
            piece.dataset.correctPosition = pieceIndex; // 存储正确位置的索引
            piece.draggable = true; // 使其可拖拽

            puzzlePieces.push({ element: piece, correctPosition: pieceIndex, currentPosition: pieceIndex });
        }
    }

    shufflePieces(); // 创建后打乱
    renderPieces(); // 渲染到页面
    addEventListeners(); // 添加拖放事件监听
}

function shufflePieces() {
     // 实现 Fisher-Yates Shuffle 算法来打乱 puzzlePieces 数组
     for (let i = puzzlePieces.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         // 交换数组元素
         [puzzlePieces[i], puzzlePieces[j]] = [puzzlePieces[j], puzzlePieces[i]];
     }
     // 更新 currentPosition，但这里直接改变数组顺序并重新添加到DOM更简单
}

function renderPieces() {
    puzzleContainer.innerHTML = ''; // 清空
    // 重新按照打乱后的顺序将块添加到 DOM
    puzzlePieces.forEach((pieceData, index) => {
        puzzleContainer.appendChild(pieceData.element);
        pieceData.currentPosition = index; // 更新当前在DOM中的位置索引
    });
}

function addEventListeners() {
    let draggedPieceElement = null; // 记录当前正在拖拽的元素

    puzzleContainer.addEventListener('dragstart', (event) => {
        draggedPieceElement = event.target.closest('.puzzle-piece'); // 获取拖拽的拼图块元素
        if (!draggedPieceElement) return; // 如果不是拼图块，忽略

        // 存储拖拽数据，虽然我们主要是通过 draggedPieceElement 变量来追踪
        event.dataTransfer.setData('text/plain', draggedPieceElement.dataset.correctPosition); // 可以存正确位置，但实际交换不需要这个
        // 添加一个类名以便于样式控制（例如半透明）
        setTimeout(() => {
            draggedPieceElement.classList.add('dragging');
        }, 0); // 使用setTimeout让类名在拖拽开始后应用
    });

    puzzleContainer.addEventListener('dragover', (event) => {
        event.preventDefault(); // 允许放置
        // 可以添加样式来指示哪个位置可以放置
    });

    puzzleContainer.addEventListener('dragleave', (event) => {
        // 移除指示放置位置的样式（如果添加了）
    });

    puzzleContainer.addEventListener('drop', (event) => {
        event.preventDefault();

        const targetElement = event.target.closest('.puzzle-piece, #puzzle-container canvas'); // 找到放置的目标块或容器内的canvas
        if (!targetElement) return; // 如果没拖放到有效区域

        let targetPieceElement = null;
        if (targetElement.classList.contains('puzzle-piece')) {
             targetPieceElement = targetElement; // 拖到了另一个拼图块上
        } else if (targetElement.tagName === 'CANVAS') {
             targetPieceElement = targetElement.parentElement; // 拖到了一个拼图块内的canvas上
        }


        if (draggedPieceElement && targetPieceElement && draggedPieceElement !== targetPieceElement) {
            // 找到了被拖拽的块和目标块，现在需要交换它们在DOM中的位置

            const draggedIndex = puzzlePieces.findIndex(p => p.element === draggedPieceElement);
            const targetIndex = puzzlePieces.findIndex(p => p.element === targetPieceElement);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                // 交换 DOM 元素
                const draggedNode = puzzleContainer.removeChild(draggedPieceElement);
                const targetNode = puzzleContainer.replaceChild(draggedNode, targetPieceElement);
                puzzleContainer.insertBefore(targetNode, draggedNode); // 确保顺序正确，replaceChild后insertBefore

                 // 交换 puzzlePieces 数组中的位置信息
                 [puzzlePieces[draggedIndex], puzzlePieces[targetIndex]] = [puzzlePieces[targetIndex], puzzlePieces[draggedIndex]];

                 // 更新 currentPosition 索引
                 puzzlePieces[draggedIndex].currentPosition = draggedIndex; // 现在这个块的新索引
                 puzzlePieces[targetIndex].currentPosition = targetIndex; // 现在这个块的新索引

                 checkCompletion(); // 检查是否完成
            }
        }

        // 移除拖拽时的样式
        if (draggedPieceElement) {
             draggedPieceElement.classList.remove('dragging');
             draggedPieceElement = null; // 清空拖拽的元素
        }

    });

    // 拖拽结束时移除样式
    puzzleContainer.addEventListener('dragend', (event) => {
        if (draggedPieceElement) {
             draggedPieceElement.classList.remove('dragging');
             draggedPieceElement = null;
        }
    });

}


function checkCompletion() {
    let isCompleted = true;
    for (let i = 0; i < puzzlePieces.length; i++) {
        // 检查当前在DOM中的位置索引 (i) 是否等于它应该在的正确位置索引
        // 注意：这里的 currentPosition 应该反映它在 puzzlePieces 数组中的索引，
        // 而这个索引对应着它在 DOM 中的顺序 (因为我们是按数组顺序 append 的)
         if (puzzlePieces[i].correctPosition !== i) {
             isCompleted = false;
             break;
         }
     }

    if (isCompleted) {
        alert('恭喜你，拼图完成！');
        // 可以在这里添加游戏结束逻辑，例如禁用拖拽，显示胜利图片等
        disableDragging();
    }
}

function disableDragging() {
     puzzlePieces.forEach(p => p.element.draggable = false);
}

// 开始按钮的事件监听
startButton.addEventListener('click', () => {
    if (image.complete && image.naturalHeight !== 0) {
         createPieces(); // 如果图片已加载，直接创建开始
    } else {
         // 等待图片加载，onload 会自动调用 createPieces
         alert('图片正在加载中，请稍候...');
    }
});

// 初始加载时如果图片已经缓存，onload可能不会触发，需要手动检查或在onload里加逻辑
if (image.complete && image.naturalHeight !== 0) {
    // 图片已经加载，可以在页面加载时就显示一个初始状态或等待点击开始
    // For simplicity, we rely on the button click to start
}