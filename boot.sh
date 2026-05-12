#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 [E-Joy Architect] System Boot Sequence Initiated...${NC}"

# --- 环境准备：NVM 初始化 ---
echo -e "${YELLOW}⚙️  [0/3] Preparing Runtime Environment...${NC}"

# 尝试加载 nvm（处理各种可能的安装路径）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 检查 nvm 是否可用
if command -v nvm &> /dev/null; then
    echo " -> Switching to Node.js v22.12..."
    nvm use 22.12
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to switch to Node.js 22.12. Please ensure it is installed (nvm install 22.12).${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  nvm not found in standard paths. Assuming correct Node version is active.${NC}"
    # 打印当前 node 版本以供确认
    echo " -> Current Node version: $(node -v)"
fi

# --- 第一步：物理层对齐（数据库同步） ---
echo -e "${YELLOW}📦 [1/3] Syncing Database Schema & Generating Prisma Client...${NC}"
pnpm --filter order-service exec prisma db push
pnpm --filter order-service exec prisma generate

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database sync failed! Aborting boot sequence.${NC}"
  exit 1
fi

# --- 第二步：点火（并行启动服务） ---
echo -e "${GREEN}🔥 [2/3] Igniting Microservices & Frontend Terminals...${NC}"

# 设置 Trap：当捕获到 Ctrl+C (SIGINT) 时，杀掉所有后台子进程
trap 'echo -e "\n${RED}🛑 Shutting down all E-Joy services...${NC}"; kill 0' SIGINT

# 后台启动服务
echo " -> Starting Order Service (9602)..."
pnpm --filter order-service run start:dev &

echo " -> Starting Admin Web (9603)..."
pnpm --filter admin-web run dev &

echo " -> Starting Customer Web (9601)..."
pnpm --filter customer-web run dev &

echo -e "${GREEN}✅ [3/3] All systems go! Monitoring logs... (Press Ctrl+C to stop all)${NC}"

# 挂起主进程，等待子进程
wait