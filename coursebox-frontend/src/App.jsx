import React, { useState, useEffect } from 'react';
import { MapPin, CalendarDays, Wallet, Sparkles, Pencil, ChevronDown } from 'lucide-react';
import axios from 'axios';

const TrippickUI = () => {
  const [formData, setFormData] = useState({
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    style: '',
    requests: ''
  });

  // 데이터 상태 관리
  const [places, setPlaces] = useState([]);
  // 선택된 장소들을 담을 바구니
  const [selectedPlaces, setSelectedPlaces] = useState([]);

  // 장소 담기 함수
  const togglePlace = (place) => {
    // 이미 담겨있는지 확인
    const isExisted = selectedPlaces.find(p => p.contentid === place.contentid);
    
    if (isExisted) {
      // 이미 있으면 제거 (선택 해제)
      setSelectedPlaces(selectedPlaces.filter(p => p.contentid !== place.contentid));
    } else {
      // 없으면 추가 (최대 5개까지만 담기로 제한해볼까?)
      if (selectedPlaces.length >= 5) {
        alert("루트는 최대 5개 장소까지 설정 가능합니다.");
        return;
      }
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };
  const [loading, setLoading] = useState(false);

  const fetchPlaces = () => {
  if (!formData.location) {
    alert("여행 지역을 입력해주세요! (예: 서울, 제주)");
    return;
  }

  setLoading(true);
  
  // 백엔드 호출
  axios.get(`http://127.0.0.1:8000/tour-data?keyword=${formData.location}`)
    .then(response => {
      // 1. 데이터 경로를 안전하게 추적 (Optional Chaining ?. 사용)
      const items = response.data.response?.body?.items?.item;

      if (items && items.length > 0) {
        // 2. [중요] 사진(firstimage)이 있는 데이터만 골라내기
        // item.firstimage가 존재하고 빈 문자열이 아닌 것만 남김
        const filteredItems = items.filter(item => item.firstimage && item.firstimage.trim() !== "");

        if (filteredItems.length > 0) {
          // 3. 사진 있는 것들 중에서 랜덤으로 섞기
          const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
          setPlaces(shuffled);
        } else {
          setPlaces([]);
          alert("사진 정보가 있는 관광지가 없습니다.");
        }
      } else {
        setPlaces([]);
        alert("검색 결과가 없습니다.");
      }
      setLoading(false);
    })
    .catch(error => {
      console.error("검색 실패:", error);
      setLoading(false);
    });
};

  // 백엔드에서 관광지 불러오기
useEffect(() => {
    setLoading(true);
    // arrange=Q: 이미지가 있는 데이터 우선 정렬
    axios.get('http://127.0.0.1:8000/tour-data?arrange=Q')
      .then(response => {
        const items = response.data.response?.body?.items?.item;

        if (items && items.length > 0) {
          // 1. 사진(firstimage)이 존재하는 데이터만 골라냅니다.
          const filteredItems = items.filter(item => item.firstimage && item.firstimage !== "");
          
          // 2. 골라낸 데이터를 랜덤으로 섞습니다.
          const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
          
          setPlaces(shuffled);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("데이터 로드 실패:", error);
        setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. Header */}
      <header className="p-6 border-b border-slate-100 flex items-center justify-center relative">
          <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                 <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
            <div>
                <h1 className="text-2xl font-black text-blue-900 tracking-tighter">COURSEBOX</h1>
                <p className="text-xs text-blue-600 font-medium -mt-1">AI Travel Planner</p>
            </div>
          </div>
      </header>

      {/* 2. Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-24 pb-16 px-6 text-center">
        <h2 className="text-5xl font-extrabold text-blue-950 leading-tight mb-4 tracking-tight">
          당신만을 위한<br />완벽한 여행 계획
        </h2>
        <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
          AI가 당신의 취향을 분석하여 최적의 여행 코스를 설계합니다
        </p>
      </section>

      {/* 3. Travel Info Form (모든 입력창 복구 완료) */}
      <main className="px-6 pb-12">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.12)] border border-slate-100">
          
          <div className="flex items-center gap-3 mb-10 pb-2 border-b-2 border-slate-100">
             <Sparkles className="w-6 h-6 text-blue-500" />
             <h3 className="text-xl font-bold text-slate-900">여행 정보 입력</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            
            {/* 여행 지역 */}
            <div className="col-span-1 md:col-span-2 space-y-2.5">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <MapPin className="w-5 h-5 text-blue-500" /> 여행 지역
              </label>
              <input 
                type="text"
                name="location"
                placeholder="예: 서울, 부산, 제주도"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>

            {/* 출발일 */}
            <div className="space-y-2.5 relative">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CalendarDays className="w-5 h-5 text-blue-500" /> 출발일
              </label>
              <input 
                type="date"
                name="startDate"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>

            {/* 도착일 */}
            <div className="space-y-2.5 relative">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CalendarDays className="w-5 h-5 text-blue-500" /> 도착일
              </label>
              <input 
                type="date"
                name="endDate"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>

            {/* 예산 */}
            <div className="col-span-1 md:col-span-2 space-y-2.5">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Wallet className="w-5 h-5 text-blue-500" /> 예산 (원)
              </label>
              <input 
                type="number"
                name="budget"
                placeholder="예: 500000"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.budget}
                onChange={handleInputChange}
              />
            </div>

            {/* 여행 스타일 */}
            <div className="col-span-1 md:col-span-2 space-y-2.5 relative">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Sparkles className="w-5 h-5 text-blue-500" /> 여행 스타일
              </label>
              <select 
                name="style"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none"
                value={formData.style}
                onChange={handleInputChange}
              >
                <option value="" disabled>여행 스타일을 선택해주세요</option>
                <option value="healing">힐링/휴식</option>
                <option value="activity">액티비티</option>
                <option value="food">맛집 투어</option>
                <option value="culture">문화/예술</option>
              </select>
              <ChevronDown className="absolute right-4 top-13 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* 추가 요청사항 */}
            <div className="col-span-1 md:col-span-2 space-y-2.5">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Pencil className="w-5 h-5 text-blue-500" /> 추가 선호도 및 요청사항
              </label>
              <textarea 
                name="requests"
                rows="4"
                placeholder="예: 카페 투어를 좋아하고, 일정은 오후부터 시작했으면 좋겠어요"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                value={formData.requests}
                onChange={handleInputChange}
              />
            </div>

          </div>

          <button 
            onClick={fetchPlaces}
            className="w-full mt-12 py-4.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" /> 여행 계획 생성하기
          </button>
        </div>
      </main>

      {/* 선택된 장소 요약 섹션 */}
      <section className="px-6 mb-10">
        {selectedPlaces.length > 0 && (
          <div className="max-w-4xl mx-auto p-6 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-blue-900">선택된 여행지 ({selectedPlaces.length}/5)</h4>
              </div>
              <p className="text-sm text-blue-700 font-medium truncate">
                {selectedPlaces.map(p => p.title).join(' → ')}
              </p>
            </div>
            
            <button className="whitespace-nowrap px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95">
              이 장소들로 AI 루트 생성하기
            </button>
          </div>
        )}
      </section>

      {/* 4. 실시간 인기 관광지 리스트 */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
           <MapPin className="w-6 h-6 text-blue-500" />
           <h3 className="text-2xl font-bold text-slate-900">지금 뜨는 인기 관광지</h3>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium">관광지 정보를 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {places.map((place) => {
              const isSelected = selectedPlaces.find(p => p.contentid === place.contentid);
              
              return (
                <div key={place.contentid} className={`group bg-white rounded-2xl overflow-hidden border ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100'} shadow-sm transition-all underline-none`}>
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={place.firstimage || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={place.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 담기 버튼 (이미지 우측 상단) */}
                    <button 
                      onClick={() => togglePlace(place)}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-500'}`}
                    >
                      {isSelected ? '✓' : '+'}
                    </button>
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-slate-900 truncate">{place.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">{place.addr1}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Footer */}
      <footer className="bg-blue-600 text-white p-10 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
            <h4 className="text-xl font-bold tracking-tight">COURSEBOX</h4>
            <p className="text-sm font-medium opacity-90">AI 기반 맞춤형 여행 플래너</p>
            <p className="text-xs opacity-70 mt-3">© 2026 COURSEBOX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TrippickUI;

//프론트 실행 명령어 : npm run dev