import React from 'react'
import Image from 'next/image'
import { VendorProps } from '@/types/vendorTypes'
import Link from 'next/link'
import { FiEdit } from 'react-icons/fi'
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import QuickActions from './QuickActions'
import ToDo from './ToDo'

const VendorBanner = ({ vendor }: VendorProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 15) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative bg-white w-[400.21px] h-[895.84px] rounded-2xl shadow-md flex flex-col items-center gap-6 py-8 px-2 ml-4 ">

      {/* Edit button top-right */}
      <Link href="/vendor-dashboard/settings" className="absolute top-4 right-4">
        <FiEdit className="text-2xl text-orange hover:text-black cursor-pointer" />
      </Link>

      {/* Profile Image */}
      <Image
        src={vendor?.profilePic || '/images/visitorPlaceholder.png'}
        alt='vendor banner'
        width={150}
        height={150}
        className='rounded-full shadow'
      />

      {/* Greeting + Business Name */}
      <div className='text-center'>
        <p className='text-xl mb-1'>
          {getGreeting()} {vendor?.fname} {vendor?.lname}!
        </p>
        <p className='text-4xl font-semibold'>{vendor?.busname}</p>
      </div>
      <div className="grid grid-cols-1 gap-6 mt-6">
           <QuickActions />
            <ToDo />
      </div>


      {/* Contact Details */}
      <div className='flex flex-col gap-3 text-left'>
        <div className='flex flex-row gap-2 items-center'>
          <FaLocationDot /><p>{vendor?.city}</p>
        </div>

        <div className='flex flex-row gap-2 items-center'>
          <FaPhoneAlt /><p>{vendor?.phone}</p>
        </div>

        <div className='flex flex-row gap-2 items-center'>
          <FaEnvelope /><p>{vendor?.email}</p>
        </div>
      </div>

    </div>
  )
}

export default VendorBanner
