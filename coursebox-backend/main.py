import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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
API_KEY = os.getenv("TOUR_API_KEY")

@app.get("/")
def read_root():
    return {"message": "코스박스 백엔드 서버가 정상 작동 중입니다!"}

@app.get("/tour-data")
def get_tour_data():
    # 한국관광공사 지역기반 관광정보 조회 서비스 (V1.1)
    url = "https://apis.data.go.kr/B551011/KorService1/areaBasedList1"
    
    params = {
        "serviceKey": API_KEY,
        "numOfRows": "10",
        "pageNo": "1",
        "MobileOS": "ETC",
        "MobileApp": "CourseBox",
        "_type": "json",
        "listYN": "Y",
        "arrange": "A",
        "contentTypeId": "12" # 관광지 타입 코드
    }
    
    try:
        # 공공데이터 서버 인증서 에러 방지를 위해 verify=False 설정
        response = requests.get(url, params=params, verify=False)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {
                "error": f"API 호출 실패 (상태 코드: {response.status_code})",
                "detail": response.text
            }
            
    except Exception as e:
        return {"error": "서버 내부 오류", "detail": str(e)}