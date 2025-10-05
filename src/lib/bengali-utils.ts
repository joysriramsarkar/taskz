// Bengali number converter utility
export const convertToBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  const numStr = num.toString()
  
  return numStr.replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)])
}

export const convertToBengaliDate = (date: Date): string => {
  const bengaliMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ]
  
  const day = convertToBengaliNumber(date.getDate())
  const month = bengaliMonths[date.getMonth()]
  const year = convertToBengaliNumber(date.getFullYear())
  
  return `${day} ${month} ${year}`
}

export const formatBengaliDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return convertToBengaliDate(dateObj)
}

// Bengali number to words converter (for small numbers)
export const numberToBengaliWords = (num: number): string => {
  if (num === 0) return 'শূন্য'
  
  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়']
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'ঊনিশ']
  const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই']
  const hundreds = ['একশো', 'দুইশো', 'তিনশো', 'চারশো', 'পাঁচশো', 'ছয়শো', 'সাতশো', 'আটশো', 'নয়শো']
  
  if (num < 10) return units[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) {
    const ten = Math.floor(num / 10)
    const unit = num % 10
    return unit > 0 ? tens[ten] + ' ' + units[unit] : tens[ten]
  }
  if (num < 1000) {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    const hundredWord = hundreds[hundred - 1]
    return remainder > 0 ? hundredWord + ' ' + numberToBengaliWords(remainder) : hundredWord
  }
  
  // For larger numbers, just convert to Bengali digits
  return convertToBengaliNumber(num)
}