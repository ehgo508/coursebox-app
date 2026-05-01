import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, CalendarDays, Sparkles, Printer, X, ArrowLeft, ChevronDown } from 'lucide-react';
import axios from 'axios';

// 1. 네이버 지도 컴포넌트 (동선 그리기 강화)
const NaverMap = ({ places = [], selectedPlaces = [], drawLines = false }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  useEffect(() => {
    const { naver } = window;
    if (!naver || !mapRef.current) return;

    const initMap = () => {
      if (!mapInstance.current) {
        mapInstance.current = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(37.5665, 126.9780),
          zoom: 12,
          zoomControl: true,
        });
      }

      const map = mapInstance.current;
      const infoWindow = new naver.maps.InfoWindow({
        backgroundColor: "transparent", borderWidth: 0, disableAnchor: true,
      });

      // 이전 마커 및 동선 제거
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) polylineRef.current.setMap(null);

      // 장소가 하나도 없으면 리턴
      if (!places || places.length === 0) return;

      const path = [];
      const bounds = new naver.maps.LatLngBounds();

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

      // 마커 생성 로직
      places.forEach((place, index) => {
        const position = new naver.maps.LatLng(place.mapy, place.mapx);
        
        // drawLines가 true(결과화면)일 때만 경로 배열에 좌표 추가
        if (drawLines) {
          path.push(position);
        }
        bounds.extend(position);

        const marker = new naver.maps.Marker({
          position,
          map,
          icon: {
            content: drawLines 
              ? `<div style="display:flex; flex-direction:column; align-items:center;">
                  <div style="width:24px; height:24px; background:#2563eb; color:white; border:2px solid white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                    ${index + 1}
                  </div>
                  <div style="margin-top:4px; padding:2px 6px; background:white; border:1px solid #2563eb; border-radius:4px; font-size:10px; font-weight:bold; white-space:nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    ${place.title}
                  </div>
                 </div>`
              : `<div style="width:12px; height:12px; background:#22c55e; border:2px solid white; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            anchor: drawLines ? new naver.maps.Point(12, 12) : new naver.maps.Point(6, 6),
          }
        });
        
        addClickEvent(marker, place.title);
        markersRef.current.push(marker);
      });

      // 선택된 마커 생성 (입력창 모달용)
      if (!drawLines && selectedPlaces.length > 0) {
        selectedPlaces.forEach((place) => {
          const position = new naver.maps.LatLng(place.mapy, place.mapx);
          const marker = new naver.maps.Marker({
            position,
            map, zIndex: 100,
            icon: {
              content: `<div style="padding:5px 8px; background:#3b82f6; border:2px solid white; color:white; font-size:12px; font-weight:bold; border-radius:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">★</div>`,
              anchor: new naver.maps.Point(15, 15),
            }
          });
          addClickEvent(marker, place.title);
          markersRef.current.push(marker);
          bounds.extend(position);
        });
      }

      // 동선 그리기 (Polyline)
      if (drawLines && path.length > 1) {
        polylineRef.current = new naver.maps.Polyline({
          path,
          map,
          strokeColor: '#2563eb',
          strokeWeight: 4,
          strokeOpacity: 0.6,
          strokeStyle: 'dash',
          endIcon: naver.maps.PointingIcon.OPEN_ARROW
        });
      }

      // 지도 시점 이동 (마커들이 모두 보이게)
      if (markersRef.current.length > 0) {
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, [places, selectedPlaces, drawLines]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }} />
  );
};

// 2. 메인 앱 컴포넌트
const TrippickUI = () => {
  const [formData, setFormData] = useState({
    location: '', startPoint: '', startTime: '', endPoint: '', endTime: '', accommodation: '', style: '', requests: ''
  });

  const [places, setPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('input');
  const [aiResult, setAiResult] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // 현재 시간 구하기 (과거 시간 선택 방지)
  const getNowDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().slice(0, 16);
  };
  const now = getNowDateTime();

  // 날짜별 그룹화 로직 (GPT 데이터)
  const groupedSchedule = useMemo(() => {
    if (!aiResult?.schedule) return {};
    return aiResult.schedule.reduce((acc, item) => {
      const dateKey = item.time.split(' ')[0] || "Day 1";
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [aiResult]);

  // 결과 화면 진입 시 첫 번째 날짜 자동 선택
  useEffect(() => {
    const ObjectKeys = Object.keys(groupedSchedule);
    if (ObjectKeys.length > 0 && !selectedDay) {
      setSelectedDay(ObjectKeys[0]);
    }
  }, [groupedSchedule, selectedDay]);

  // 현재 날짜의 지도 데이터 매칭
  const currentDayPlaces = useMemo(() => {
    if (!selectedDay || !groupedSchedule[selectedDay]) return [];
    return groupedSchedule[selectedDay]
      .map(item => {
        // GPT 응답 장소명과 TourAPI 장소명을 부분 일치로 찾음
        const match = places.find(p => p.title.includes(item.place) || item.place.includes(p.title));
        return match ? match : null;
      })
      .filter(Boolean); // null 값 제거
  }, [selectedDay, groupedSchedule, places]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // 추천 장소 검색 (TourAPI)
  const fetchPlaces = async () => {
    if (!formData.location) return alert("여행 지역을 입력해주세요!");
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/tour-data?keyword=${formData.location}`);
      const items = response.data.response?.body?.items?.item;
      setPlaces(Array.isArray(items) ? items : items ? [items] : []);
      setIsModalOpen(true);
    } catch (e) { 
      console.error(e);
      alert("추천 장소를 불러오는데 실패했습니다."); 
    }
    setLoading(false);
  };

  // 장소 담기 토글
  const togglePlace = (place) => {
    const isExisted = selectedPlaces.find(p => p.contentid === place.contentid);
    if (isExisted) {
      setSelectedPlaces(selectedPlaces.filter(p => p.contentid !== place.contentid));
    } else {
      if (selectedPlaces.length >= 5) return alert("최대 5개까지만 선택할 수 있습니다.");
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  // AI 코스 생성 요청 (GPT-5.4)
  const handleGenerateAIPlan = async () => {
    const { location, startPoint, startTime, endPoint, endTime } = formData;
    if (!location || !startPoint || !startTime || !endPoint || !endTime) {
      return alert("지역, 출발/종료 지점 및 시간은 필수 입력사항입니다!");
    }

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/generate-course", {
        ...formData, 
        must_visit: selectedPlaces.map(p => p.title), 
        style: formData.style || "general"
      });
      const parsedData = JSON.parse(response.data.choices[0].message.content);
      setAiResult(parsedData);
      setSelectedDay(null); // 초기화하여 useEffect에서 첫날 잡도록 유도
      setViewMode('result');
      window.scrollTo(0, 0);
    } catch (e) { 
      console.error(e);
      alert("AI 루트 생성 중 오류가 발생했습니다."); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. Header (공통) */}
      <header className="p-6 border-b border-slate-100 flex items-center justify-center sticky top-0 bg-white/90 backdrop-blur-md z-[100] w-full">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-blue-900 leading-none tracking-tighter">COURSEBOX</h1>
            </div>
        </div>
      </header>

      {viewMode === 'input' ? (
        /* --- [입력 화면 모드] --- */
        <div className="animate-in fade-in duration-500">
          {/* Hero Section */}
          <section className="relative h-[85vh] flex flex-col items-center justify-center bg-gray-950 px-6 text-center overflow-hidden group">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=2000&auto=format&fit=crop"
                alt="Travel Background"
                className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] z-10"></div> 
            </div>

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
                <span className="inline-block opacity-0 animate-[fadeUp_1s_ease-out_0.8s_forwards] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.4)]">
                  코스박스
                </span>
              </h2>

              <p className="opacity-0 animate-[fadeUp_1s_ease-out_1.3s_forwards] text-lg md:text-xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
                데이터로 설계하고 감성으로 떠나는 <br />
                당신만의 초개인화 여정
              </p>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0 animate-[fadeIn_1s_ease-out_1.2s_forwards]">
              <button 
                onClick={() => document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' })}
                className="cursor-pointer text-white/40 hover:text-white transition-all hover:translate-y-1 animate-bounce"
              >
                <ChevronDown className="w-10 h-10" />
              </button>
            </div>
          </section>

          {/* Travel Info Form */}
          <main className="px-6 py-24 bg-white relative z-30">
            <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.12)] border border-slate-100">
              <div className="flex items-center gap-3 mb-10 pb-4 border-b-2 border-slate-100">
                 <Sparkles className="w-6 h-6 text-blue-500" />
                 <h3 className="text-xl font-bold">여행 설계 시작하기</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="col-span-1 md:col-span-2">
                  <label className="flex items-center gap-2 font-bold mb-2"><MapPin className="w-5 h-5 text-blue-500"/> 여행 지역</label>
                  <div className="flex gap-2">
                    <input name="location" placeholder="예: 부산" className="flex-1 p-4.5 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200" value={formData.location} onChange={handleInputChange} />
                    <button onClick={fetchPlaces} className="px-6 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all">추천 장소 담기</button>
                  </div>
                </div>

                <div className="space-y-3 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <label className="font-bold text-blue-900 flex items-center gap-2"><MapPin className="w-4 h-4"/> 출발 정보</label>
                  <input name="startPoint" placeholder="출발지 (예: 서울역, 집)" className="w-full p-3 rounded-lg border-none focus:ring-2 focus:ring-blue-200 outline-none" value={formData.startPoint} onChange={handleInputChange}/>
                  <input type="datetime-local" name="startTime" min={now} className="w-full p-3 rounded-lg border-none text-slate-600 focus:ring-2 focus:ring-blue-200 outline-none" value={formData.startTime} onChange={handleInputChange} />
                </div>

                <div className="space-y-3 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <label className="font-bold text-indigo-900 flex items-center gap-2"><MapPin className="w-4 h-4"/> 종료 정보</label>
                  <input name="endPoint" placeholder="종료지 (예: 제주공항, 집)" className="w-full p-3 rounded-lg border-none focus:ring-2 focus:ring-indigo-200 outline-none" value={formData.endPoint} onChange={handleInputChange}/>
                  <input type="datetime-local" name="endTime" min={formData.startTime || now} className="w-full p-3 rounded-lg border-none text-slate-600 focus:ring-2 focus:ring-indigo-200 outline-none" value={formData.endTime} onChange={handleInputChange} />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="flex items-center gap-2 font-bold mb-2"><CalendarDays className="w-5 h-5 text-blue-500"/> 예약된 숙소 정보 (선택)</label>
                  <textarea name="accommodation" placeholder="미입력 시 AI가 동선에 맞춰 추천해 드립니다." className="w-full p-4.5 bg-slate-50 rounded-xl resize-none h-24 outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200" value={formData.accommodation} onChange={handleInputChange} />
                </div>
                
                <div className="col-span-1 md:col-span-2 relative">
                  <label className="flex items-center gap-2 font-bold mb-2"><Sparkles className="w-5 h-5 text-blue-500" /> 여행 스타일</label>
                  <select name="style" className="w-full p-4.5 bg-slate-50 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 text-slate-600" value={formData.style} onChange={handleInputChange}>
                    <option value="" disabled>어떤 테마를 원하시나요?</option>
                    <option value="healing">힐링/휴식</option>
                    <option value="activity">액티비티</option>
                    <option value="food">맛집 투어</option>
                    <option value="culture">문화/예술</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-[50px] w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button onClick={handleGenerateAIPlan} disabled={loading} className={`w-full mt-10 py-5 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-[1.01] transition-all ${loading ? 'opacity-50' : ''}`}>
                {loading ? "경로 최적화 중..." : "AI 초개인화 루트 생성하기"}
              </button>
            </div>
          </main>
        </div>
      ) : (
        /* --- [AI 결과 화면 모드] --- */
        <div className="bg-slate-50 min-h-screen pb-20 animate-in slide-in-from-right duration-500">
          <section className="max-w-4xl mx-auto px-6 py-12">
            
            {/* 타이틀 영역 */}
            <div className="text-center mb-12">
              <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">
                AI Optimized Route Powered by GPT-5.4
              </span>
              <h2 className="text-4xl font-black text-slate-900 mb-4">{aiResult?.course_title}</h2>
              <div className="flex items-center justify-center flex-wrap gap-4 text-slate-500 font-medium text-sm">
                <span><MapPin className="inline w-4 h-4 mr-1"/>{formData.location}</span> • 
                <span>{formData.startTime?.replace('T', ' ')} 출발</span> • 
                <span>{formData.endPoint} 종료</span>
              </div>
            </div>

            {/* 날짜 선택 탭 */}
            <div className="flex justify-center gap-3 mb-12 overflow-x-auto pb-4">
              {Object.keys(groupedSchedule).map((dayDate, index) => (
                <button
                  key={dayDate}
                  onClick={() => setSelectedDay(dayDate)}
                  className={`px-8 py-3 rounded-full font-bold transition-all whitespace-nowrap ${
                    selectedDay === dayDate 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Day {index + 1} ({dayDate})
                </button>
              ))}
            </div>

            {/* 타임라인 (지도보다 위에 배치) */}
            <div className="relative border-l-4 border-blue-200 ml-6 pl-10 space-y-10 mb-16 max-w-3xl mx-auto">
              {(groupedSchedule[selectedDay] || []).map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[50px] top-1 w-6 h-6 bg-white border-4 border-blue-600 rounded-full shadow-md z-10 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-300 transition-colors">
                    <div className="mb-3">
                      <span className="text-blue-600 font-black text-sm bg-blue-50 px-3 py-1 rounded-lg">
                        {item.time.split(' ')[1] || item.time}
                      </span>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-800 mb-2">{item.place}</h4>
                    <p className="text-slate-600 leading-relaxed text-sm">{item.memo}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 지도 (하단 배치 - PDF 저장 시 겹침 방지) */}
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 mb-12">
              <h3 className="text-lg font-bold mb-4 px-2 text-slate-800 flex items-center gap-2">
                <MapPin className="text-blue-600"/> {selectedDay} 전체 동선 지도
              </h3>
              <div className="h-[450px]">
                <NaverMap 
                  places={currentDayPlaces} 
                  drawLines={true} 
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-4 max-w-2xl mx-auto">
              <button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                <Printer size={20} /> PDF 저장 / 인쇄
              </button>
              <button onClick={() => { setViewMode('input'); setSelectedDay(null); }} className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                새로운 계획 만들기
              </button>
            </div>

          </section>
        </div>
      )}

      {/* 추천 장소 모달창 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[32px] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-white">
              <h4 className="text-xl font-bold">추천 장소 담기 <span className="text-blue-600">({selectedPlaces.length}/5)</span></h4>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
               {/* 모달 내 지도 (동선 안그림) */}
               <div className="h-[300px] mb-8">
                 <NaverMap places={places} selectedPlaces={selectedPlaces} drawLines={false} />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {places.map((place) => {
                   const isSelected = selectedPlaces.find(p => p.contentid === place.contentid);
                   return (
                     <div key={place.contentid} className={`bg-white rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? 'border-blue-500 shadow-md' : 'border-slate-100'}`}>
                       <div className="relative h-40 bg-slate-200">
                         <img src={place.firstimage || 'https://via.placeholder.com/400'} className="w-full h-full object-cover" alt={place.title} />
                         <button onClick={() => togglePlace(place)} className={`absolute top-3 right-3 w-10 h-10 rounded-xl font-bold flex justify-center items-center shadow-lg transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:text-blue-500'}`}>
                           {isSelected ? '✓' : '+'}
                         </button>
                       </div>
                       <div className="p-4">
                         <h4 className="font-bold truncate text-slate-800">{place.title}</h4>
                         <p className="text-xs text-slate-500 mt-1 truncate">{place.addr1}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
            
            <div className="p-4 bg-white border-t flex justify-center">
               <button onClick={() => setIsModalOpen(false)} className="w-full max-w-md py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">장소 선택 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-blue-600 text-white p-12 text-center">
        <h4 className="text-2xl font-black tracking-tighter">COURSEBOX</h4>
        <p className="text-sm opacity-70 mt-3 font-medium">© 2026 리코박스 개발팀. AI 기반 맞춤형 여행 일정 생성 서비스.</p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default TrippickUI;