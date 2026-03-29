import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from urllib.parse import unquote

# 1. 환경 변수 로드 (.env 파일 읽기)
load_dotenv()

app = FastAPI()

# 2. CORS 설정 (리액트 등 프론트엔드 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. API 키 설정 (매뉴얼 권장사항: 공백 제거 및 디코딩 처리)
raw_key = os.getenv("TOUR_API_KEY")
# 키 양쪽의 공백을 제거하고, 인코딩된 특수문자를 원래대로 되돌립니다.
API_KEY = unquote(raw_key.strip()) if raw_key else None

@app.get("/")
def root():
    """서버 작동 여부 확인용 홈 경로"""
    return {
        "status": "running",
        "message": "코스박스 백엔드 서버가 정상 작동 중입니다!",
        "endpoints": {
            "tour_data": "/tour-data",
            "docs": "/docs"
        }
    }

@app.get("/tour-data")
def get_tour_data(keyword: str = None): # keyword 파라미터 추가
    # 만약 키워드가 있으면 '키워드 검색 API'를 사용하고, 없으면 기존 '지역기반 API'를 사용함
    if keyword:
        url = "https://apis.data.go.kr/B551011/KorService2/searchKeyword2"
    else:
        url = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2"
    
    params = {
        "serviceKey": API_KEY,
        "numOfRows": "9",
        "pageNo": "Math.floor(Math.random() * 100) + 1",
        "MobileOS": "ETC",
        "MobileApp": "CourseBox",
        "_type": "json",
        "arrange": "C",
    }

    # 키워드가 있을 때만 keyword 파라미터 추가
    if keyword:
        params["keyword"] = keyword
    else:
        params["contentTypeId"] = "12"
    
    try:
        response = requests.get(url, params=params, verify=False)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

# 서버 실행 명령어: uvicorn main:app --reload