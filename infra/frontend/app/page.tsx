"use client"

import { useRouter } from "next/navigation"

function Page() {
  const router = useRouter()

  const navigateToDashboard = () => {
    router.push("/dashboard")
  }

  return (
    <div className='relative flex flex-row items-center justify-center min-h-screen overflow-hidden'>
      <div className='absolute top-4 right-4 z-20'>
      <div className="flex flex-row items-center bg-white px-4 py-2 rounded-3xl shadow-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={navigateToDashboard}>
        <div className="text-2xl text-black font-mono hover:text-gray-600">Dashboard</div>
        <div className="text-2xl text-black ml-2">→</div>
      </div>
      </div>

      <div className='absolute inset-0'>
      {[...Array(50)].map((_, i) => (
        <div
        key={i}
        className='absolute w-1 h-1 bg-white rounded-full animate-pulse'
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`
        }}
        />
      ))}
      {[...Array(20)].map((_, i) => (
        <div
        key={`star-${i}`}
        className='absolute w-2 h-2 bg-white rounded-full animate-ping'
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 4}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }}
        />
      ))}
      </div>
      
      <div className='relative z-10 flex flex-row items-center'>
      <div className='text-4xl font-mono text-white'>
        Welcome to
      </div>
      <div className='bg-orange-400 w-75 h-20 transform rotate-[-3deg] flex items-center justify-center ml-5 shadow-2xl animate-[hop_2s_ease-out_forwards]'>
        <span className='text-black font-mono text-6xl font-bold transform rotate-[3deg]'>SmolHog</span>
      </div>
      </div>
      
      <style jsx>{`
      @keyframes hop {
        0% {
        transform: translateX(200px) translateY(0px) rotate(-3deg);
        opacity: 0;
        }
        25% {
        transform: translateX(150px) translateY(-30px) rotate(-3deg);
        opacity: 0.3;
        }
        50% {
        transform: translateX(100px) translateY(0px) rotate(-3deg);
        opacity: 0.6;
        }
        75% {
        transform: translateX(50px) translateY(-20px) rotate(-3deg);
        opacity: 0.8;
        }
        100% {
        transform: translateX(0px) translateY(0px) rotate(-3deg);
        opacity: 1;
        }
      }
      `}</style>
    </div>
  )
}

export default Page