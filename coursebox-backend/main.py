import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from urllib.parse import unquote

# .env 파일에 저장된 환경 변수(API 키 등)를 불러옵니다.
load_dotenv()

app = FastAPI()

# 1단계: CORS 설정 추가
# 리액트(프론트엔드)에서 백엔드 API에 접근할 수 있도록 허용합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # 모든 도메인 허용 (개발 단계)
    allow_credentials=True,
    allow_methods=["*"],      # 모든 HTTP 메서드 허용
    allow_headers=["*"],      # 모든 헤더 허용
)

# .env 파일에서 TOUR_API_KEY라는 이름으로 저장된 값을 가져옵니다.
API_KEY = unquote(os.getenv("TOUR_API_KEY"))

@app.get("/")
def read_root():
    return {"message": "코스박스 백엔드 서버가 정상 작동 중입니다!"}

@app.get("/tour-data")
def get_tour_data():
    # 최신 규격인 KorService2의 areaBasedList2를 사용합니다.
    url = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2"
    
    params = {
        "serviceKey": API_KEY,  # .env에서 불러온 키
        "numOfRows": "10",
        "pageNo": "1",
        "MobileOS": "ETC",
        "MobileApp": "CourseBox",
        "_type": "json",        # 반드시 소문자 json
        "listYN": "Y",          # 반드시 대문자 Y
        "arrange": "A",         # 반드시 대문자 A
        "contentTypeId": "12"   # 관광지(12), 숙박(32) 등
    }
    
    try:
        # ⚠️ 매우 중요: params를 딕셔너리로 넘기지 않고, URL 뒤에 직접 붙여서 보낼 때 더 안정적입니다.
        response = requests.get(url, params=params, verify=False)
        
        # 터미널에서 실제 요청된 주소를 확인하기 위한 디버깅 코드 (나중에 지워도 됨)
        print(f"요청 URL: {response.url}")
        
        if response.status_code == 200:
            result = response.json()
            # 결과 코드가 0000 혹은 0이어야 성공입니다.
            return result
        else:
            return {
                "error": f"API 호출 실패 (상태 코드: {response.status_code})",
                "detail": response.text
            }
            
    except Exception as e:
        return {"error": "서버 내부 오류", "detail": str(e)}