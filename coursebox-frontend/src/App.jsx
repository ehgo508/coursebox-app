import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CalendarDays, Wallet, Sparkles, Pencil, ChevronDown } from 'lucide-react';
import axios from 'axios';

const NaverMap = ({ places, selectedPlaces }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const { naver } = window;
    if (!naver || !mapRef.current) return;

    const initMap = () => {
      if (!mapInstance.current && mapRef.current) {
        mapInstance.current = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(37.5665, 126.9780),
          zoom: 10,
          zoomControl: true,
        });
      }

      const map = mapInstance.current;
      if (!map) return;

      const infoWindow = new naver.maps.InfoWindow({
        backgroundColor: "transparent",
        borderWidth: 0,
        disableAnchor: true,
      });

      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const addClickEvent = (marker, title) => {
        naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.setContent(`
            <div style="padding:10px; background:white; border-radius:12px; border:1px solid #3b82f6; font-size:13px; font-weight:bold; box-shadow:0 4px 12px rgba(0,0,0,0.1); color:#1e293b;">
              ${title}
            </div>
          `);
          infoWindow.open(map, marker);
        });
      };

      const newMarkers = places.map((place) => {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(place.mapy, place.mapx),
          map: map,
          icon: {
            content: `<div style="width:12px; height:12px; background:#22c55e; border:2px solid white; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            anchor: new naver.maps.Point(6, 6),
          }
        });
        addClickEvent(marker, place.title);
        return marker;
      });

      const selectedMarkers = selectedPlaces.map((place) => {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(place.mapy, place.mapx),
          map: map,
          zIndex: 100,
          icon: {
            content: `<div style="padding:5px 8px; background:#3b82f6; border:2px solid white; color:white; font-size:12px; font-weight:bold; border-radius:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">★</div>`,
            anchor: new naver.maps.Point(15, 15),
          }
        });
        addClickEvent(marker, place.title);
        return marker;
      });

      markersRef.current = [...newMarkers, ...selectedMarkers];

      if (markersRef.current.length > 0) {
        const bounds = new naver.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, [places, selectedPlaces]);

  return (
    <div 
      id="map" 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px', 
        borderRadius: '20px', 
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc' 
      }} 
    />
  );
};

const TrippickUI = () => {
  const [formData, setFormData] = useState({
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    style: '',
    requests: ''
  });

  const [places, setPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const togglePlace = (place) => {
    const isExisted = selectedPlaces.find(p => p.contentid === place.contentid);
    if (isExisted) {
      setSelectedPlaces(selectedPlaces.filter(p => p.contentid !== place.contentid));
    } else {
      if (selectedPlaces.length >= 5) {
        alert("루트는 최대 5개 장소까지 설정 가능합니다.");
        return;
      }
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  const fetchPlaces = () => {
    if (!formData.location) {
      alert("여행 지역을 입력해주세요! (예: 서울, 제주)");
      return;
    }
    setLoading(true);
    setShowRecommendations(true);
    
    axios.get(`http://127.0.0.1:8000/tour-data?keyword=${formData.location}`)
      .then(response => {
        const items = response.data.response?.body?.items?.item;
        if (items) {
          const itemsArray = Array.isArray(items) ? items : [items];
          const shuffled = [...itemsArray].sort(() => Math.random() - 0.5);
          setPlaces(shuffled);
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

  const handleGenerateAIPlan = () => {
    const { location, startDate, endDate, budget, style, requests } = formData;
    if (!location || !startDate || !endDate) {
      alert("지역과 여행 날짜는 꼭 입력해주세요!");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      alert(`${location} AI 루트 생성 시작!`);
      setLoading(false);
    }, 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. Header */}
      <header className="p-6 border-b border-slate-100 flex items-center justify-center relative w-full bg-white z-50">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
          <div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tighter leading-none">COURSEBOX</h1>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">AI Travel Planner</p>
          </div>
        </div>
      </header>

      {/* 2. Hero Section - 그라데이션 복구 및 가독성 최적화 */}
<section className="relative h-[85vh] flex flex-col items-center justify-center bg-gray-950 px-6 text-center overflow-hidden group">
  
  {/* 배경 레이어 */}
  <div className="absolute inset-0 z-0">
    <img 
      src="https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=2000&auto=format&fit=crop"
      alt="Travel Background"
      className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
    />
    {/* 오버레이를 살짝 더 진하게(70%) 해서 글씨 색감을 살림 */}
    <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] z-10"></div> 
  </div>

  {/* 콘텐츠 레이어 */}
  <div className="relative z-20 flex flex-col items-center pb-8">
    <div className="opacity-0 animate-[fadeUp_0.8s_ease-out_forwards] flex justify-center mb-8">
      <span className="text-[10px] font-black tracking-[0.3em] text-white/90 uppercase bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
        AI Travel Planning Revolution
      </span>
    </div>

    <h2 className="text-5xl md:text-7xl font-black leading-[1.25] tracking-[-0.03em] mb-8 text-white">
      <span className="inline-block opacity-0 animate-[fadeUp_1s_ease-out_0.3s_forwards]">
        여행 계획의 새로운 지평을 열다,
      </span>
      <br />
      {/* [복구] 코스박스 그라데이션 - 더 밝고 선명한 하늘색~에메랄드 조합 */}
      <span className="inline-block opacity-0 animate-[fadeUp_1s_ease-out_0.8s_forwards] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.4)]">
        코스박스
      </span>
    </h2>

    <p className="opacity-0 animate-[fadeUp_1s_ease-out_1.3s_forwards] text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
      데이터로 설계하고 감성으로 떠나는 <br />
      당신만의 초개인화 여정
    </p>
  </div>

  {/* 하단 화살표 */}
  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0 animate-[fadeIn_1s_ease-out_1.2s_forwards]">
    <button 
      onClick={() => {
        const formElement = document.querySelector('main');
        formElement?.scrollIntoView({ behavior: 'smooth' });
      }}
      className="cursor-pointer text-white/40 hover:text-white transition-all hover:translate-y-1 animate-bounce"
    >
      <ChevronDown className="w-10 h-10 stroke-[1.5px]" />
    </button>
  </div>

  <style>{`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(25px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `}</style>
</section>

      {/* 3. Travel Info Form */}
      <main className="px-6 py-24 bg-white relative z-30">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.12)] border border-slate-100">
          <div className="flex items-center gap-3 mb-10 pb-2 border-b-2 border-slate-100">
             <Sparkles className="w-6 h-6 text-blue-500" />
             <h3 className="text-xl font-bold text-slate-900">여행 정보 입력</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="col-span-1 md:col-span-2 space-y-2.5">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <MapPin className="w-5 h-5 text-blue-500" /> 여행 지역
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  name="location"
                  placeholder="예: 서울, 부산, 제주도"
                  className="flex-1 p-4.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.location}
                  onChange={handleInputChange}
                />
                <button 
                  onClick={fetchPlaces}
                  className="px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all active:scale-95 whitespace-nowrap"
                >
                  추천 장소 보기
                </button>
              </div>
            </div>

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
              <ChevronDown className="absolute right-4 top-[58px] w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2.5">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Pencil className="w-5 h-5 text-blue-500" /> 추가 선호도 및 요청사항
              </label>
              <textarea 
                name="requests"
                rows="4"
                placeholder="예: 카페 투어를 좋아하고..."
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                value={formData.requests}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <button 
            onClick={handleGenerateAIPlan}
            className="w-full mt-12 py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Sparkles className="w-6 h-6 animate-pulse" /> 나만의 AI 여행 루트 생성하기
          </button>
        </div>
      </main>
      
      {/* 4. 추천 리스트 섹션 */}
      {showRecommendations && (
        <div className="bg-white pb-24">
          <section className="max-w-4xl mx-auto px-6 mb-10">
            <h3 className="text-xl font-bold mb-4 text-slate-800">추천 여행지 지도</h3>
            <NaverMap places={places} selectedPlaces={selectedPlaces} />
          </section>
          
          <section className="px-6 mb-12">
            {selectedPlaces.length > 0 && (
              <div className="max-w-4xl mx-auto p-6 bg-blue-600 rounded-3xl shadow-xl flex items-center justify-between gap-4 text-white">
                <div>
                  <h4 className="font-bold text-lg">AI 루트에 포함될 장소 ({selectedPlaces.length}/5)</h4>
                  <p className="text-sm opacity-90">{selectedPlaces.map(p => p.title).join(' → ')}</p>
                </div>
              </div>
            )}
          </section>

          <section className="px-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {places.map((place, index) => {
                const isSelected = selectedPlaces.find(p => p.contentid === place.contentid);
                return (
                  <div 
                    key={place.contentid} 
                    style={{ animationDelay: `${index * 100}ms` }}
                    className={`group bg-white rounded-[32px] overflow-hidden border-2 transition-all duration-300 ${isSelected ? 'border-blue-500 scale-[1.02]' : 'border-slate-50'}`}
                  >
                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                      <img src={place.firstimage || 'https://via.placeholder.com/400x300'} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => togglePlace(place)}
                        className={`absolute top-4 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isSelected ? 'bg-blue-600 text-white rotate-[360deg]' : 'bg-white/90 text-slate-400'}`}
                      >
                        {isSelected ? <Sparkles className="w-6 h-6" /> : '+'}
                      </button>
                    </div>
                    <div className="p-6 text-center">
                      <h4 className="text-xl font-bold truncate">{place.title}</h4>
                      <p className="text-sm text-slate-500">{place.addr1}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 5. Footer */}
      <footer className="bg-blue-600 text-white p-10 text-center">
        <h4 className="text-xl font-bold">COURSEBOX</h4>
        <p className="text-xs opacity-70 mt-3">© 2026 COURSEBOX. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TrippickUI;

//프론트 실행 명령어 : npm run dev