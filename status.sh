RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
MAGENTA="\e[35m"
CYAN="\e[36m"
NC="\e[0m"

BOT_NAME="dankmemes.edu website"
MAIN="./index.js"

PID_ORIGINAL=$(cat pid 2>/dev/null)

if [ "$1" == "start" ]; then
	if [ -z $(ps -ef | awk '/[n]ode/{print $2}') ]; then
		echo -e "${CYAN}Starting ${BOT_NAME}..."
		echo -e "Booting node process"
		node ${MAIN} > stdout.log 2> stderr.log &
		echo -e "Grabbing node PID"
		ps -ef | awk '/[n]ode/{print $2}' > pid
		echo -e "Dumping node PID: ${MAGENTA}$(cat pid)${GREEN}"
		echo -e "Bot is online.${NC}"
	else
		echo -e "${CYAN}A node instance is already running. Please run ${YELLOW}./status.sh stop ${CYAN}first.${NC}"
	fi
elif [ "$1" == "stop" ]; then
	if [ -z $(ps -ef | awk '/[n]ode/{print $2}') ]; then
		echo -e "${CYAN}No identifiable node instance is currently running.${NC}"
	else
		echo -e "${CYAN}Stopping node instance..."
		kill $(cat pid)
		rm -f pid
		echo -e "Node instance stopped."
		echo -e "Bot offline.${NC}"
	fi
elif [ "$1" == "clean" ]; then
	if [ -z $(ps -ef | awk '/[n]ode/{print $2}') ]; then
		rm -f pid stdout.log stderr.log
		echo -e "${CYAN}Removed pid, stdout.log, and stderr.log files.${NC}"
	else
		echo -e "${CYAN}A node instance is already running. Please run ${YELLOW}./status.sh stop ${CYAN}first.${NC}"
	fi
elif [ "$1" == "restart" ]; then
	if [ -z $(ps -ef | awk '/[n]ode/{print $2}') ]; then
		echo -e "${CYAN}Starting ${BOT_NAME}..."
		echo -e "Booting node process"
		node ${MAIN} > stdout.log 2> stderr.log &
		echo -e "Grabbing node PID"
		ps -ef | awk '/[n]ode/{print $2}' > pid
		echo -e "Dumping node PID: ${MAGENTA}$(cat pid)${GREEN}"
		echo -e "Bot is online.${NC}"
	else
		echo -e "${CYAN}Stopping node instance..."
		kill $(cat pid)
		rm -f pid
		echo -e "Node instance stopped."
		echo -e "Bot offline.${NC}"
		echo -e "${YELLOW}Restarting the bot..."
		echo -e "${CYAN}Starting ${BOT_NAME}..."
		echo -e "Booting node process"
		node ${MAIN} > stdout.log 2> stderr.log &
		echo -e "Grabbing node PID"
		ps -ef | awk '/[n]ode/{print $2}' > pid
		echo -e "Dumping node PID: ${MAGENTA}$(cat pid)${GREEN}"
		echo -e "Bot is online.${NC}"
	fi
elif [ "$1" == "log" ]; then
	printf "${RED}"
	cat stderr.log 2>/dev/null
	printf "${NC}"
	echo -e ""
	cat stdout.log 2>/dev/null
else
	if [ -z $(ps -ef | awk '/[n]ode/{print $2}') ]; then
		echo -e "${RED}BOT OFFLINE${CYAN} - No identifiable node instance is currently running. Run ${YELLOW}./status.sh start ${CYAN} to start the bot."
		rm -f pid
	else
		echo -e "${GREEN}BOT ONLINE${CYAN} - A node instance is currently running: ${MAGENTA}$(cat pid 2>/dev/null)${NC}"
	fi
	printf "${RED}"
	cat stderr.log 2>/dev/null
	printf "${NC}"
fi

$SHELL