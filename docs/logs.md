build log — hari

1. researched why public ai benchmarks break down (contamination, saturation, goodhart's law)

2. studied deepswe as the evaluation pattern worth copying: novel tasks, fixed harness, behavioral verifiers, human review

3. mapped platform architecture across domains (instruction, json, coding, math, writing, swe)

4. current focus: benchmark mechanism first — instruction follow verifier, eval api, minimal bench ui

5. probably next gonna make sure we are building a benchmakr with proper metrics possibly 

6. the next thing we need to do after benchmarking is actually test it out like benchmarking them properly  seeing which model does it good etc 

7. so thats how benchmarking is going to be happening as well so another thing we need to keep in midn is how we are goign totake care of benching in different parameters or diffeerent categories 

8. what we have done today is to add a new whole layer to it by layer what i mean here is the whole new conept of benching iwht stupid things by stupid things i mean the challenges like chess , xo game , stuff like that 

9. added three new goal games: palindrome check (tests character-level reasoning, tokenization artifacts), time adder (AM/PM transitions, carry-over arithmetic), calendar hop (modular day-of-week arithmetic with difficulty scaling). all three deterministically verifiable in JS, all three target documented model failure modes.

10. expanded instruction task pool to ~181 seed tasks across easy/medium/hard. hard tasks now consistently stack 5-6 simultaneous constraints to find the compliance cliff.

11. rewrote the "how we bench" doc with a substantial section on why public benchmarks actually fail — the contamination lifecycle, specific evidence for MMLU/HumanEval/GSM8K, and a new section tying the goal/behavioral probe approach to the formal eval pipeline. docs now explain the difference between measuring capability and measuring retrieval.


12. added more questions section to it as well to further imporve the quality of questiosnw e askfor becnhing the whole paltform for all ai agents across differnet apis throughout the whole paltform for now we are foccusing on SWE bench and BASIC general questions too 


13. next we are going to strengthen the whole layer where people can plug in their own api to the interface we can query it and then make beenches and test out their own models is what we are going to do next uo 


14. other changes that we are going to do includes the overhaul of the whole design but eh its in works for now 


15. most part these are the changes we did today as of now and will be pushed to the repo 



16. the most interesting part ocmes next 

17 another important part we are working on rihg tnow is the whole concept of having to let any ai agent to participate in this as well so that means any api so we gotta do proper securit here for sstarters maube verified ai only 




18 need to pdate teh docs need to do that its still outdated might get started with it now but yeah 



that is the whole motive of what we are building now 
main motto right now is securitng the whole platform even mroe 


but the part main here is the whole securit like RLS 



ok so wer aer going to do the next part of this whole section


another thing we are going to do here is completing this further enhancing the whole benchmark system we have right now



19. next thing we are starting to focus on towards is building a rubric system to track perfomrmance of all agents across the platform in different challenges as well 


20. we are next going to be moving on with the next section which is going to be the whole part of us managing the different api from different agents etc 


21. next we are planing on making the whole visualization is better with different agents etc




curret scenario:

added and refined the entire website to be perfect condition 


few areas which i want to work towards on teh future includes :

 1. the actual arena and make it live by having a proper backend ( probably will use a websocket to manage the changes between them etc and poprerly manage them )
 2. a proper ecosystem and management of agets and a secure system fo it as well 
 3. a management system and a crew of reviewers for the challenges set of rthe agents as well is something which si required ehre  
 4. a proper managemetn for agents maybe even a porfile system for them and save logs of agetns to make sure we can have a leaderbopard for them etc 
 5. another major improvement which we need to do includes the whole inclusion of different mechanisms in benching making sure there is no contamination in teh assigenements  / tests whihc teha gents get 


 these are the sections i will be wroking towards to coplete on and finish up before the next devlog / update in macondo specificaly 