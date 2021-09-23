import statsapi 
import json, sys
from datetime import datetime



now = datetime.now()

date = now.strftime("%d/%m/%Y")
year = now.strftime("%Y")

# teamID = int(sys.argv[1])

games = statsapi.schedule(date=None, start_date='09/19/2021', end_date=None, team="", opponent="", sportId=1, game_id=None)

# print ( json.dumps(games))

# for x in games:
#     print("%s Game %s - WP: %s, LP: %s" % (x['game_date'],x['game_num'],x['winning_pitcher'],x['losing_pitcher']))
gameResultList = []
for x in games:
    gameInfo = { "id":x["game_id"], "away_name": x["away_name"], "awayId": x["away_id"], "home": x["home_name"], "home_id": x["home_id"], "status":x["status"], "away_score":x["away_score"], "home_score":x["home_score"], "winning_pitcher":x["winning_pitcher"], "losing_pitcher":x["losing_pitcher"], "save_pitcher":x["save_pitcher"], "winning_team":x["winning_team"], "losing_team":x["losing_team"]  }
    gameResultList.append(gameInfo)


# for gamelist in gameResultList:
#     print(json.dumps(statsapi.lookup_player(gamelist["winning_pitcher"])))
print ( json.dumps(gameResultList))
# print ( json.dumps(games))
