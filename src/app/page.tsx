"use client";

import React, {
  useState,
  useRef,
  useEffect,
  MouseEvent,
  DragEvent,
} from "react";

/**
 * 导入flag SVG 文件
 */
import logo1Src from "../../public/flag.svg";

/**
 * Logo 状态接口定义
 * @interface LogoState
 * @property {number} x - Logo 在画布上的 X 坐标
 * @property {number} y - Logo 在画布上的 Y 坐标
 * @property {number} width - Logo 的宽度
 * @property {number} height - Logo 的高度
 */
interface LogoState {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 拖拽状态接口定义
 * @interface DragState
 * @property {boolean} isDragging - 当前是否正在拖拽
 * @property {"none" | "logo1"} target - 拖拽目标：none 表示无，logo1 表示flag
 * @property {number} offsetX - 鼠标点击位置相对于 Logo 左上角的 X 轴偏移
 * @property {number} offsetY - 鼠标点击位置相对于 Logo 左上角的 Y 轴偏移
 */
interface DragState {
  isDragging: boolean;
  target: "none" | "logo1";
  offsetX: number;
  offsetY: number;
}

/**
 * 主应用组件
 * @returns {JSX.Element} 渲染的应用界面
 */
export default function App() {
  /** Canvas 引用，用于主编辑区域 */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Canvas 引用，用于圆形预览区域 */
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  /** 文件输入引用，用于图片上传 */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 状态：用户上传的基础图片 */
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  /** 状态：原始图片尺寸，用于导出时保持原始分辨率 */
  const [originalSize, setOriginalSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  /** 状态：flag图片 */
  const [logo1, setLogo1] = useState<HTMLImageElement | null>(null);

  /** 状态：flag的位置和尺寸信息 */
  const [logo1Pos, setLogo1Pos] = useState<LogoState>({
    x: 10,
    y: 500, // 初始 Y 坐标设为画布高度，在图片加载后会更新
    width: 0,
    height: 0,
  });

  /** 状态：当前拖拽状态 */
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    target: "none",
    offsetX: 0,
    offsetY: 0,
  });

  /** 状态：是否有文件正在拖拽到上传区域上方 */
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  /**
   * 效果：组件加载时预加载flag
   * 1. 加载 SVG 图片
   * 2. 计算在 500x500 画布上的等比缩放尺寸
   * 3. 设置初始位置（底部居中，向上偏移 15px）
   */
  useEffect(() => {
    const img1 = new Image();
    img1.src = logo1Src.src;
    img1.onload = () => {
      if (!canvasRef.current) return;
      const canvasWidth = 500;
      const canvasHeight = 500;

      // 计算等比缩放后的尺寸
      const scale1 = canvasWidth / img1.width;
      const w1 = img1.width * scale1;
      const h1 = img1.height * scale1;

      // 计算初始位置
      const x = (canvasWidth - w1) / 2; // 水平居中
      const y = canvasHeight - h1 - 15; // 底部向上偏移 15px

      setLogo1(img1);
      setLogo1Pos((prev) => ({ ...prev, width: w1, height: h1, x, y }));
    };
  }, []);

  /**
   * 效果：主绘制函数
   * 职责：
   * 1. 初始化和维护两个画布（编辑区域和预览区域）
   * 2. 绘制用户上传的图片（居中且等比缩放）
   * 3. 绘制flag
   * 4. 创建圆形预览效果
   *
   * 触发条件：
   * - 基础图片更改时
   * - flag加载完成时
   * - flag位置变化时
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!canvas || !previewCanvas) return;

    const ctx = canvas.getContext("2d");
    const previewCtx = previewCanvas.getContext("2d");
    if (!ctx || !previewCtx) return;

    // 初始化画布尺寸
    canvas.width = 500;
    canvas.height = 500;
    previewCanvas.width = 500;
    previewCanvas.height = 500;

    // 清空画布内容
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (baseImage) {
      // 计算等比缩放尺寸
      const scale = Math.min(
        canvas.width / baseImage.width,
        canvas.height / baseImage.height,
      );
      const scaledWidth = baseImage.width * scale;
      const scaledHeight = baseImage.height * scale;

      // 计算居中位置
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      // 绘制头像
      ctx.drawImage(baseImage, x, y, scaledWidth, scaledHeight);
    } else {
      // 绘制默认提示界面
      ctx.fillStyle = "#E0E0E0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#616161";
      ctx.textAlign = "center";
      ctx.font = "16px sans-serif";
      ctx.fillText("请上传图片", canvas.width / 2, canvas.height / 2);
    }

    // 绘制flag
    if (logo1) {
      ctx.drawImage(
        logo1,
        logo1Pos.x,
        logo1Pos.y,
        logo1Pos.width,
        logo1Pos.height,
      );
    }

    // 创建圆形预览
    previewCtx.save();
    previewCtx.beginPath();
    const centerX = previewCanvas.width / 2;
    const centerY = previewCanvas.height / 2;
    const radius = Math.min(previewCanvas.width, previewCanvas.height) / 2;
    previewCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    previewCtx.clip();
    previewCtx.drawImage(canvas, 0, 0);
    previewCtx.restore();
  }, [baseImage, logo1, logo1Pos]);

  /**
   * 处理上传的图片文件
   * @param {File} file - 用户选择或拖拽的文件
   */
  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 记录原始图片尺寸（用于导出）
          setOriginalSize({ width: img.width, height: img.height });
          // 更新显示图片
          setBaseImage(img);

          // 重新定位flag
          if (logo1) {
            setLogo1Pos((prev) => ({
              ...prev,
              x: (500 - prev.width) / 2, // 水平居中
              y: 500 - prev.height - 25, // 底部位置向上偏移 25px
            }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      alert("请上传图片文件。");
    }
  };

  /**
   * 处理文件选择事件
   * @param {React.ChangeEvent<HTMLInputElement>} e - 文件选择事件
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  /**
   * 处理文件拖拽到上传区域事件
   * @param {DragEvent<HTMLDivElement>} e - 拖拽事件
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  /**
   * 处理文件离开拖拽区域事件
   * @param {DragEvent<HTMLDivElement>} e - 拖拽事件
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  /**
   * 处理文件拖拽放置事件
   * @param {DragEvent<HTMLDivElement>} e - 拖拽事件
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  /**
   * 获取鼠标在 Canvas 上的实际坐标
   * @param {MouseEvent<HTMLCanvasElement>} e - 鼠标事件
   * @returns {{x: number, y: number}} 转换后的坐标
   */
  const getMousePos = (
    e: MouseEvent<HTMLCanvasElement>,
  ): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  /**
   * 检查指定坐标是否在目标区域内
   * @param {LogoState} pos - 目标区域的位置和尺寸
   * @param {number} x - 检查的 X 坐标
   * @param {number} y - 检查的 Y 坐标
   * @returns {boolean} 是否命中目标区域
   */
  const isHit = (pos: LogoState, x: number, y: number) => {
    return (
      x >= pos.x &&
      x <= pos.x + pos.width &&
      y >= pos.y &&
      y <= pos.y + pos.height
    );
  };

  /**
   * 处理鼠标按下事件
   * 检查是否点击到flag，如果是则开始拖拽
   */
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    let newDragState: DragState = {
      isDragging: false,
      target: "none",
      offsetX: 0,
      offsetY: 0,
    };

    if (logo1 && isHit(logo1Pos, x, y)) {
      newDragState = {
        isDragging: true,
        target: "logo1",
        offsetX: x - logo1Pos.x,
        offsetY: y - logo1Pos.y,
      };
    }

    setDragState(newDragState);
    e.preventDefault();
  };

  /**
   * 处理鼠标移动事件
   * 如果正在拖拽flag，则更新其位置
   */
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !canvasRef.current) return;

    const { x, y } = getMousePos(e);
    const newX = x - dragState.offsetX;
    const newY = y - dragState.offsetY;

    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;

    if (dragState.target === "logo1") {
      // 计算新位置（限制在画布范围内）
      const targetNewX = Math.max(
        0,
        Math.min(newX, canvasWidth - logo1Pos.width),
      );
      const targetNewY = Math.max(
        0,
        Math.min(newY, canvasHeight - logo1Pos.height),
      );

      // 仅当位置发生变化时更新状态
      if (targetNewX !== logo1Pos.x || targetNewY !== logo1Pos.y) {
        setLogo1Pos((prev) => ({ ...prev, x: targetNewX, y: targetNewY }));
      }
    }
  };

  /**
   * 处理鼠标释放事件
   * 重置拖拽状态
   */
  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      target: "none",
      offsetX: 0,
      offsetY: 0,
    });
  };

  /**
   * 处理下载事件
   * 1. 创建临时画布，使用原始图片尺寸
   * 2. 绘制原始图片
   * 3. 按比例绘制flag
   * 4. 导出为 PNG 文件
   */
  const handleDownload = () => {
    if (!baseImage || originalSize.width === 0) {
      alert("请先上传一张图片后再下载。");
      return;
    }

    // 创建临时画布
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = originalSize.width;
    tempCanvas.height = originalSize.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // 计算从预览尺寸到原始尺寸的缩放比例
    const scale = originalSize.width / 500;

    // 绘制原始尺寸的图片
    tempCtx.drawImage(baseImage, 0, 0, originalSize.width, originalSize.height);

    // 按比例绘制flag
    if (logo1) {
      tempCtx.drawImage(
        logo1,
        logo1Pos.x * scale,
        logo1Pos.y * scale,
        logo1Pos.width * scale,
        logo1Pos.height * scale,
      );
    }

    // 导出并下载
    const link = document.createElement("a");
    link.download = "avatar-with-flag.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    // 修改主容器背景色为更亮的白灰色调
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-gray-100 text-gray-800">
      {/* 新标题 */}
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-700">
        <span className="inline md:inline">头像添加鱼板跨旗工具</span>
        <span className="block text-center md:inline">🏳️‍⚧️🍥</span>
      </h1>

      {/* 修改卡片背景色和阴影 */}
      <div className="w-full max-w-6xl bg-white p-4 md:p-8 rounded-lg shadow-lg">
        <div className="flex flex-col gap-8">
          {/* 块 1: 上传图片 */}
          <div>
            {/* 将隐藏的 input 放在交互区域外 */}
            <input
              ref={fileInputRef}
              id="base-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="选择头像图片"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="上传图片，点击或拖拽文件到此处"
              title="上传图片，点击或拖拽文件到此处"
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer
                          ${isDraggingOver ? "border-blue-400 bg-gray-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}
                          transition-colors`}
            >
              <span className="px-4 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600">
                选择头像图片
              </span>
              <p className="mt-2 text-sm text-gray-500">或拖拽图片到此处</p>
            </div>
          </div>

          {/* 块 2: 左右布局的画布区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 左侧: 编辑画布 */}
            <div>
              <p className="mb-2 text-lg text-gray-700 text-center">
                编辑区域（可拖拽旗帜调整位置）
              </p>
              <div className="w-full overflow-auto">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg mx-auto ${
                    dragState.isDragging ? "cursor-grabbing" : "cursor-grab"
                  } max-w-full`}
                  tabIndex={0}
                  role="img"
                  aria-label="头像编辑画布，按住并拖动旗帜以移动位置"
                  title="头像编辑画布，按住并拖动旗帜以移动位置"
                >
                  您的浏览器不支持 Canvas
                </canvas>
              </div>
            </div>

            {/* 右侧: 预览画布 */}
            <div>
              <p className="mb-2 text-lg text-gray-700 text-center">
                推特头像预览效果
              </p>
              <div className="w-full overflow-auto">
                <canvas
                  ref={previewCanvasRef}
                  className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-full mx-auto max-w-full aspect-square"
                  role="img"
                  aria-label="预览效果"
                  title="预览效果"
                >
                  您的浏览器不支持 Canvas
                </canvas>
              </div>
            </div>
          </div>

          {/* 块 4: 下载 */}
          <div className="max-w-lg mx-auto w-full">
            <button
              onClick={handleDownload}
              disabled={!baseImage}
              className="w-full bg-green-500 text-white font-bold py-4 px-8 rounded-lg text-xl hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              下载合成后的头像
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
