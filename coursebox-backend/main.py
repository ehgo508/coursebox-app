from fastapi import FastAPI
import requests

app = FastAPI()

# ⭐️ 아까 그 키를 여기에 넣어둬 (동기화되면 바로 쓸 수 있게!)
API_KEY = "7d6b4fb2585306c87da550c030fa78fda379e720e3fde6f9efd452a21da54a21"

@app.get("/")
def read_root():
    return {"message": "코스박스 백엔드 서버가 정상 작동 중입니다!"}

@app.get("/tour-data")
def get_tour_data():
    # 여기서 공공데이터 API를 호출할 거야
    url = "https://apis.data.go.kr/B551011/KorService1/areaBasedList1"
    params = {
        "serviceKey": API_KEY,
        "numOfRows": "5",
        "pageNo": "1",
        "MobileOS": "ETC",
        "MobileApp": "CourseBox",
        "_type": "json"
    }
    
    response = requests.get(url, params=params, verify=False)
    return response.json()