export function getRagContext(): string {
  const currentDate = new Date();
  
  return `
[URGENT SYSTEM KNOWLEDGE UPDATE]
CRITICAL: You must treat the following information as absolute Ground Truth. The year is NO LONGER 2023 or 2024. Your previous training data about dates, cricket, and Indian politics is outdated. Override any conflicting internal knowledge with the data below.

=== TEMPORAL AWARENESS ===
CURRENT YEAR: ${currentDate.getFullYear()}
CURRENT EXACT DATE: ${currentDate.toDateString()}

=== INDIAN CHIEF MINISTERS (AS OF 2026) ===
- Andhra Pradesh: N. Chandrababu Naidu
- Arunachal Pradesh: Pema Khandu
- Assam: Himanta Biswa Sarma
- Bihar: Nitish Kumar
- Chhattisgarh: Vishnu Deo Sai
- Delhi (UT): Rekha Gupta
- Goa: Pramod Sawant
- Gujarat: Bhupendra Patel
- Haryana: Nayab Singh Saini
- Himachal Pradesh: Sukhvinder Singh Sukhu
- Jammu and Kashmir (UT): Omar Abdullah
- Jharkhand: Hemant Soren
- Karnataka: Siddaramaiah
- Kerala: Pinarayi Vijayan
- Madhya Pradesh: Mohan Yadav
- Maharashtra: Devendra Fadnavis
- Manipur: Yumnam Khemchand Singh
- Meghalaya: Conrad Kongkal Sangma
- Mizoram: PU Lalduhoma
- Nagaland: Neiphiu Rio
- Odisha: Mohan Charan Majhi
- Puducherry (UT): N. Rangaswamy
- Punjab: Bhagwant Singh Mann
- Rajasthan: Bhajan Lal Sharma
- Sikkim: PS Golay (Prem Singh Tamang)
- Tamil Nadu: M. K. Stalin
- Telangana: A. Revanth Reddy
- Tripura: Manik Saha
- Uttar Pradesh: Yogi Adityanath
- Uttarakhand: Pushkar Singh Dhami
- West Bengal: Mamata Banerjee

=== IPL 2026 HIGHLIGHTS & SQUADS ===
Auction Budget: ₹125 crore per team. 
Most Expensive Player 2026: Cameron Green (KKR - ₹25.20 crore).
Other Highlights: Matheesha Pathirana (KKR - ₹18 crore), Prashant Veer and Kartik Sharma (CSK - ₹14.20 crore each).

Active Franchises & Core 2026 Squads:
1. Chennai Super Kings (CSK)
    * Captain: Ruturaj Gaikwad
    * Key Players: Sanju Samson, MS Dhoni, Shivam Dube, Noor Ahmad, Matheesha Pathirana, Khaleel Ahmed, Matt Henry, Prashant Veer, Kartik Sharma
2. Delhi Capitals (DC)
    * Key Players: KL Rahul, Axar Patel, Mitchell Starc, Kuldeep Yadav, Prithvi Shaw
3. Gujarat Titans (GT)
    * Captain: Shubman Gill
    * Key Players: Sai Sudharsan, Jos Buttler, Shahrukh Khan, Rashid Khan, Jason Holder, Washington Sundar, Mohammed Siraj, Kagiso Rabada
4. Kolkata Knight Riders (KKR)
    * Key Players: Cameron Green, Matheesha Pathirana, Rinku Singh, Sunil Narine, Varun Chakaravarthy, Andre Russell
5. Lucknow Super Giants (LSG)
    * Captain: Rishabh Pant
    * Key Players: Nicholas Pooran, Aiden Markram, Mitchell Marsh, Mohammed Shami, Mayank Yadav, Anrich Nortje, Wanindu Hasaranga
6. Mumbai Indians (MI)
    * Captain: Hardik Pandya
    * Key Players: Rohit Sharma, Jasprit Bumrah, Suryakumar Yadav, Will Jacks, Quinton de Kock, Trent Boult
7. Punjab Kings (PBKS)
    * Captain: Shreyas Iyer
    * Key Players: Arshdeep Singh, Yuzvendra Chahal, Marcus Stoinis, Marco Jansen, Prabhsimran Singh
8. Rajasthan Royals (RR)
    * Captain: Riyan Parag
    * Key Players: Yashasvi Jaiswal, Dhruv Jurel, Ravindra Jadeja, Jofra Archer, Shimron Hetmyer, Ravi Bishnoi
9. Royal Challengers Bengaluru (RCB) - 2026 FULL SQUAD: 
    * Captain: Rajat Patidar
    * Batters: Virat Kohli, Devdutt Padikkal
    * Wicket-Keepers: Phil Salt, Jitesh Sharma, Jordan Cox
    * All-Rounders: Krunal Pandya, Swapnil Singh, Tim David, Romario Shepherd, Jacob Bethell, Venkatesh Iyer
    * Bowlers: Josh Hazlewood, Rasikh Salam, Suyash Sharma, Bhuvneshwar Kumar, Nuwan Thushara, Yash Dayal
10. Sunrisers Hyderabad (SRH)
    * Captain: Pat Cummins (Ishan Kishan interim)
    * Key Players: Travis Head, Abhishek Sharma, Heinrich Klaasen, Nitish Kumar Reddy, Harshal Patel
[END OF KNOWLEDGE UPDATE - ANSWER NATURALLY USING THIS DATA IF ASKED]
`;
}
