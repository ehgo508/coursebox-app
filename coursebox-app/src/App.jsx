import React, { useState } from 'react';
import { MapPin, CalendarDays, Wallet, Sparkles, Pencil, Search, ChevronDown } from 'lucide-react';

const TrippickUI = () => {
  const [formData, setFormData] = useState({
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    style: '',
    requests: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. Header (Logo & Title) */}
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

      {/* 3. Travel Info Form (White Card) */}
      <main className="px-6 pb-24">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(59,130,246,0.12)] border border-slate-100">
          
          {/* Form Header */}
          <div className="flex items-center gap-3 mb-10 pb-2 border-b-2 border-slate-100">
             <Sparkles className="w-6 h-6 text-blue-500" />
             <h3 className="text-xl font-bold text-slate-900">여행 정보 입력</h3>
             <p className="text-sm text-slate-500 font-medium ml-1">원하시는 여행 스타일과 조건을 알려주시면 완벽한 계획을 만들어 드립니다</p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            
            {/* Input: Location */}
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

            {/* Input: Start Date */}
            <div className="space-y-2.5 relative">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CalendarDays className="w-5 h-5 text-blue-500" /> 출발일
              </label>
              <input 
                type="date"
                name="startDate"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none"
                value={formData.startDate}
                onChange={handleInputChange}
              />
               <ChevronDown className="absolute right-4 top-13 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* Input: End Date */}
            <div className="space-y-2.5 relative">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <CalendarDays className="w-5 h-5 text-blue-500" /> 도착일
              </label>
              <input 
                type="date"
                name="endDate"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition appearance-none"
                value={formData.endDate}
                onChange={handleInputChange}
              />
              <ChevronDown className="absolute right-4 top-13 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* Input: Budget */}
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

            {/* Select: Travel Style */}
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

            {/* Textarea: Additional Requests */}
            <div className="col-span-1 md:col-span-2 space-y-2.5">
              <label className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <Pencil className="w-5 h-5 text-blue-500" /> 추가 선호도 및 요청사항
              </label>
              <textarea 
                name="requests"
                rows="4"
                placeholder="예: 카페 투어를 좋아하고, 늦잠을 자서 일정은 오후부터 시작했으면 좋겠어요"
                className="w-full p-4.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                value={formData.requests}
                onChange={handleInputChange}
              />
            </div>

          </div>

          {/* Submit Button */}
          <button className="w-full mt-12 py-4.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
            <Sparkles className="w-5 h-5" /> 여행 계획 생성하기
          </button>

        </div>
      </main>

      {/* 4. Footer */}
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