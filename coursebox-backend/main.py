import os
import requests
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from urllib.parse import unquote
from pydantic import BaseModel
from typing import List

# 1. 환경 변수 로드
load_dotenv()

app = FastAPI()

# 2. CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. API 키 설정 및 보안 처리
raw_tour_key = os.getenv("TOUR_API_KEY")
raw_openai_key = os.getenv("OPENAI_API_KEY")

# 공공데이터 키: 디코딩 처리 포함
API_KEY = unquote(raw_tour_key.strip()) if raw_tour_key else None
# OpenAI 키: 공백 제거 처리 (GPT-5.4 연동용)
OPENAI_API_KEY = raw_openai_key.strip() if raw_openai_key else None

# 키 로드 상태 확인
if not OPENAI_API_KEY:
    print("⚠️ 경고: OPENAI_API_KEY를 찾을 수 없습니다. .env 파일을 확인하세요.")
if not API_KEY:
    print("⚠️ 경고: TOUR_API_KEY를 찾을 수 없습니다. .env 파일을 확인하세요.")

class CourseRequest(BaseModel):
    location: str
    startPoint: str          # 출발 지점
    startTime: str           # 출발 시간
    endPoint: str            # 종료 지점
    endTime: str             # 종료 시간
    accommodation: str = ""  # 숙소 정보 (선택 사항)
    style: str
    requests: str = ""       # 추가 요청사항
    must_visit: List[str]

# --- 엔드포인트 시작 ---

@app.get("/")
def root():
    """서버 작동 여부 확인용 홈 경로"""
    return {
        "status": "running",
        "message": "코스박스 백엔드 서버가 정상 작동 중입니다!",
        "endpoints": {
            "tour_data": "/tour-data",
            "ai_course": "/api/generate-course",
            "docs": "/docs"
        }
    }

@app.get("/tour-data")
def get_tour_data(keyword: str = None):
    """공공데이터 TourAPI 관광지 정보 가져오기"""
    if keyword:
        url = "https://apis.data.go.kr/B551011/KorService2/searchKeyword2"
    else:
        url = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2"
    
    params = {
        "serviceKey": API_KEY,
        "numOfRows": "50", 
        "pageNo": "1",
        "MobileOS": "ETC",
        "MobileApp": "CourseBox",
        "_type": "json",
        "arrange": "A",
    }

    if keyword:
        params["keyword"] = keyword
    
    try:
        response = requests.get(url, params=params, verify=False)
        return response.json()
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/generate-course")
async def generate_ai_course(data: CourseRequest):
    system_instruction = f"""
    당신은 초정밀 여행 설계사입니다. GPT-5.4의 논리력을 발휘하여 아래 조건에 맞는 완벽한 일정을 짜세요.
    
    [기본 정보]
    - 여행 지역: {data.location}
    - 여행 스타일: {data.style}
    - 추가 요청사항: {data.requests}
    
    [시공간 제약 조건 (매우 중요)]
    - 시작: {data.startPoint}에서 {data.startTime}에 반드시 출발해야 합니다. 첫 일정은 시작 지점 근처에서 구성하세요.
    - 종료: {data.endPoint}에서 {data.endTime}에 여행이 최종 종료되어야 합니다.
    - 숙소 정보: {data.accommodation if data.accommodation else "미정 (동선에 맞는 숙소를 직접 추천해 주세요)"}
    - 일정은 반드시 시작 시간부터 종료 시간까지 비는 시간 없이 꽉 채워야 하며, 숙박이 있다면 매일 마지막 일정은 숙소 복귀로 마무리하세요.
    
    [필수 방문 장소]
    사용자가 선택한 장소 리스트: {data.must_visit}
    이 장소들을 동선상 가장 효율적인 시간대에 우선 배치하고, 남는 시간은 당신이 추천하는 명소나 식당으로 채우세요.
    
    [JSON 출력 형식]
    {{
      "course_title": "여행 제목",
      "schedule": [
        {{ "time": "MM/DD HH:MM", "place": "장소명", "memo": "이유 및 설명" }}
      ]
    }}
    """

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 2026년 3월 출시된 gpt-5.4 모델 사용
    payload = {
        "model": "gpt-5.4", 
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"{data.location} 지역 {data.style} 여행 코스 짜줘. 필수 장소: {data.must_visit}"}
        ],
        "response_format": { "type": "json_object" } # JSON 모드 활성화
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status() # 오류 발생 시 예외 발생
        return response.json()
    except Exception as e:
        return {"error": f"GPT API 통신 중 오류 발생: {str(e)}"}

# 서버 실행 명령어: uvicorn main:app --reload