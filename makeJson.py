import statsapi
import json
import sys
import os 
from datetime import datetime
# team_leader_data
# cardinals 138     Kwang Hyun Kim
# angels    108     Shohei Ohtani
path = "/Users/minchulcho/Desktop/pp/data3"
fileList = os.listdir(path)
 
print("Files and directories in '", path, "' :")
 
# prints all files
print(fileList)
#playerName = sys.argv[1]
#폴더에서 파일 읽기 
path = "/Users/minchulcho/Desktop/pp/"

myfile = "_mlb_los-angeles-dodgers_albert-pujols-795_.json"
f = open(path+myfile, "r")
playerInfo = f.read()


#선수 이름 가지고 오기 
data = json.loads(playerInfo)
fileName = data["pathname"]
playerName = data["playerinfo"]["name"] 


# #팀 ID 가지고 오기 
# x = fileName.split("/")[2].split("-")
# teamName = " ".join(x)
# teamInfo = statsapi.lookup_team(teamName)
# teamId = teamInfo[0]["id"]
# playerCurrTeam = teamInfo[0]
# # if ( len(teamInfo) == 1): 
# #     teamId = teamInfo[0]["id"]
# #     playerCurrTeam = teamInfo[0]
# # else: 
# #     for team in teamInfo: 
# #         if ( team["id"] == data["currentTeam"]["id"]):
# #             teamId = team["id"]
# #             playerCurrTeam = team


playersInfoList = statsapi.lookup_player(playerName)

if ( len(playersInfoList) == 1): 
    playerId = playersInfoList[0]["id"]
else: 
    for team in playersInfoList: 
        if ( team["currentTeam"]["id"] == teamId): 
            playerId = team["id"]

# # print ( data )  #나이, 경험, 타투, 대학, 에이전트, 
# # print(playerCurrTeam)

returnJson = { 
    "playerInfo" : data, 
    "teamInfo" : playerCurrTeam
} 

newFileName = str(playerId)

with open(newFileName+'.json', 'w') as f:
    f.write(json.dumps(returnJson))
