@echo off
echo ===================================
echo Enbon 后端服务器启动脚本
echo ===================================
echo.

cd /d %~dp0

echo [1/4] 检查环境...
node --version
npm --version
echo.

echo [2/4] 检查依赖...
if not exist "node_modules" (
    echo 依赖未安装，正在安装...
    call npm install
)
echo.

echo [3/4] 检查目录...
if not exist "data" mkdir data
if not exist "storage" mkdir storage
echo.

echo [4/4] 启动开发服务器...
echo.
npm run start:dev

pause

