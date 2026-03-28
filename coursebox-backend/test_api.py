import requests
import json

# 스크린샷에서 확인한 그 키를 그대로 넣으세요
API_KEY = "7d6b4fb2585306c87da550c030fa78fda379e720e3fde6f9efd452a21da54a21"

# [핵심 수정] 주소 끝에 '1'이 붙은 최신 엔드포인트입니다.
url = "https://apis.data.go.kr/B551011/KorService1/areaBasedList1"

params = {
    "serviceKey": API_KEY,
    "numOfRows": "10",
    "pageNo": "1",
    "MobileOS": "ETC",
    "MobileApp": "CourseBox",
    "_type": "json",      # JSON 형식 요청
    "listYN": "Y",
    "arrange": "A",
    "contentTypeId": "12" # 12는 '관광지' 코드입니다.
}

print("최신 API 주소로 데이터를 요청합니다... 🚀")

try:
    # verify=False는 보안 인증서 에러 방지용입니다.
    response = requests.get(url, params=params, verify=False)
    
    if response.status_code == 200:
        data = response.json()
        # 결과물 출력
        print(json.dumps(data, indent=4, ensure_ascii=False))
    else:
        print(f"에러 발생! 상태 코드: {response.status_code}")
        print(f"메시지: {response.text}")

except Exception as e:
    print(f"연결 오류: {e}")