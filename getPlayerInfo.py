import statsapi 
import json, sys

playerName = sys.argv[1]

jsonList = []


for player in statsapi.lookup_player(playerName):
    imgURL = "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/"+str(player['id'])+"/headshot/67/current"
    jsonList.append( { "name":player['fullName'], "position":player['primaryPosition']['abbreviation'], "id":player['id'], "teamId":player["currentTeam"]["id"], "imgae":imgURL })      

print(json.dumps(jsonList))
