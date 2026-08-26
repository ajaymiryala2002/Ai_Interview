import prisma from '../config/db';
import { sendInterviewResultEmail } from './email.service';

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','shall','can','need','dare','ought','used','to','of','in','for','on','with','at','by','from','as','into','through','during','before','after','above','below','between','under','and','but','or','yet','so','if','because','although','though','while','where','when','that','which','who','whom','whose','what','this','these','those','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','her','its','our','their','mine','yours','hers','ours','theirs','myself','yourself','himself','herself','itself','ourselves','yourselves','themselves','one','ones','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','than','too','very','just','now','then','also','here','there','thus','hence','however','therefore','moreover','furthermore','nevertheless','nonetheless','otherwise','instead','meanwhile','besides','accordingly','consequently','else','perhaps','probably','possibly','likely','surely','certainly','definitely','absolutely','relatively','comparatively','extremely','quite','rather','fairly','pretty','somewhat','slightly','hardly','barely','scarcely','rarely','seldom','sometimes','often','frequently','usually','always','generally','typically','normally','commonly','widely','broadly','fully','totally','completely','entirely','wholly','partly','partially','mainly','mostly','largely','primarily','principally','chiefly','especially','particularly','specifically','notably','remarkably','strikingly','surprisingly','interestingly','importantly','significantly','substantially','considerably','markedly','noticeably','obviously','clearly','evidently','apparently','seemingly','presumably','supposedly','allegedly','reportedly','said','says','use','using','used','uses','way','ways','method','methods','approach','approaches','technique','techniques','process','processes','procedure','procedures','step','steps','stage','stages','phase','phases','part','parts','section','sections','segment','segments','piece','pieces','portion','portions','share','shares','fraction','fractions','proportion','proportions','percentage','percentages','amount','amounts','quantity','quantities','number','numbers','count','counts','sum','sums','total','totals','whole','wholes','half','halves','third','thirds','quarter','quarters','bit','bits','lot','lots','plenty','deal','deals','number','numbers','dozen','dozens','hundred','hundreds','thousand','thousands','million','millions','billion','billions','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','last','final','next','previous','following','preceding','prior','subsequent','later','earlier','sooner','eventually','finally','ultimately','initially','originally','formerly','previously','beforehand','afterwards','afterward','lately','recently','currently','presently','today','tomorrow','yesterday','soon','shortly','immediately','instantly','directly','straight','once','twice','again','further','farther','near','nearer','nearest','close','closer','closest','best','better','good','well','bad','worse','worst','little','less','least','much','many','more','most','far','further','furthest','farther','farthest','old','older','oldest','new','newer','newest','young','younger','youngest','early','earlier','earliest','late','later','latest','last','long','longer','longest','short','shorter','shortest','high','higher','highest','low','lower','lowest','deep','deeper','deepest','shallow','shallower','shallowest','fast','faster','fastest','slow','slower','slowest','quick','quicker','quickest','rapid','rapidly','swift','swiftly','speedy','speedily','hasty','hastily','brisk','briskly','prompt','promptly','instant','instantaneous','immediate','immediately','direct','directly','straight','straightaway','right','rightly','correct','correctly','exact','exactly','precise','precisely','accurate','accurately','perfect','perfectly','complete','completely','entire','entirely','total','totally','whole','wholly','full','fully','absolute','absolutely','utter','utterly','sheer','pure','purely','mere','merely','simple','simply','plain','plainly','clear','clearly','obvious','obviously','evident','evidently','apparent','apparently','seeming','seemingly','likely','probably','possibly','perhaps','maybe','perchance','mayhap','presumably','supposedly','allegedly','reportedly','reputedly','putatively','arguably','possibly','maybe','perhaps','probably','likely','presumably','supposedly','seemingly','apparently','evidently','obviously','clearly','plainly','patently','manifestly','noticeably','markedly','remarkably','strikingly','surprisingly','amazingly','astonishingly','interestingly','curiously','oddly','strangely','weirdly','bizarrely','funnily','luckily','fortunately','unfortunately','unluckily','sadly','happily','gladly','joyfully','cheerfully','merrily','mirthfully','jovially','jocularly','playfully','sportively','waggishly','drolly','comically','humorously','funny','amusingly','entertainingly','divertingly','engagingly','interestingly','fascinatingly','intriguingly','captivatingly','absorbingly','grippingly','rivetingly','compellingly','enthrallingly','spellbindingly','mesmerizingly','hypnotically','magically','mystically','mysteriously','enigmatically','cryptically','obscurely','abstrusely','reconditely','esoterically','arcane','occult','secret','secretly','privately','confidentially','personally','individually','separately','independently','autonomously','freely','voluntarily','willingly','readily','eagerly','keenly','enthusiastically','zealously','fervently','ardently','passionately','intensely','fiercely','vehemently','violently','forcefully','powerfully','strongly','mightily','potently','vigorously','energetically','dynamically','actively','busily','industriously','assiduously','sedulously','diligently','painstakingly','meticulously','scrupulously','punctiliously','carefully','cautiously','warily','guardedly','circumspectly','prudently','discreetly','tactfully','diplomatically','politically','strategically','tactically','operationally','functionally','practically','realistically','pragmatically','sensibly','reasonably','rationally','logically','coherently','consistently','uniformly','evenly','equally','equivalently','similarly','likewise','alike','analogously','comparably','correspondingly','respectively','mutually','reciprocally','jointly','collectively','together','combined','united','connected','linked','related','associated','affiliated','attached','bound','tied','fastened','fixed','set','settled','established','confirmed','verified','validated','authenticated','certified','accredited','licensed','approved','endorsed','sanctioned','authorized','commissioned','delegated','deputed','assigned','allotted','allocated','apportioned','distributed','dispensed','disbursed','issued','granted','given','bestowed','conferred','awarded','presented','offered','proffered','tendered','extended','rendered','provided','supplied','furnished','equipped','outfitted','fitted','suited','adapted','adjusted','modified','altered','changed','transformed','converted','turned','made','created','produced','generated','formed','shaped','molded','fashioned','designed','devised','contrived','concocted','fabricated','manufactured','constructed','built','erected','assembled','put','placed','set','laid','positioned','located','situated','stationed','posted','assigned','allotted','allocated','designated','named','called','termed','styled','dubbed','christened','baptized','entitled','labeled','tagged','marked','branded','stamped','printed','written','typed','inscribed','engraved','etched','carved','cut','chiseled','sculpted','sculptured','modeled','molded','cast','forged','wrought','worked','processed','treated','handled','managed','directed','controlled','governed','ruled','regulated','administered','operated','run','driven','conducted','led','guided','steered','piloted','navigated','sailed','flown','ridden','driven','walked','marched','paced','strode','stepped','trod','trampled','stamped','stomped','jumped','leaped','bounded','sprung','hopped','skipped','danced','pranced','capered','frolicked','romped','gamboled','cavorted','sported','played','gamed','competed','contended','vied','struggled','striven','endeavored','attempted','tried','essayed','assayed','tested','proved','verified','confirmed','validated','authenticated','certified','warranted','guaranteed','ensured','insured','secured','safeguarded','protected','shielded','screened','guarded','defended','fortified','strengthened','reinforced','supported','upheld','maintained','sustained','preserved','conserved','saved','rescued','redeemed','delivered','freed','liberated','released','emancipated','enfranchised','empowered','enabled','allowed','permitted','let','left','remained','stayed','abided','dwelt','resided','lived','existed','been','become','got','gotten','grown','turned','fallen','risen','gone','come','arrived','reached','attained','achieved','accomplished','completed','finished','done','ended','terminated','ceased','stopped','halted','paused','broken','interrupted','discontinued','suspended','deferred','postponed','delayed','retarded','hindered','impeded','obstructed','blocked','barred','checked','curbed','restrained','restricted','limited','confined','bound','circumscribed','defined','specified','stated','declared','announced','proclaimed','pronounced','uttered','spoken','said','told','related','narrated','recounted','recited','rehearsed','repeated','reiterated','restated','rephrased','paraphrased','translated','interpreted','explained','expounded','explicated','elucidated','clarified','cleared','illuminated','enlightened','informed','apprised','advised','counseled','consulted','conferred','discussed','debated','argued','disputed','controverted','contradicted','denied','refuted','rebutted','repudiated','rejected','declined','refused','spurned','scorned','disdained','despised','contemned','loathed','abhorred','detested','hated','disliked','averted','shunned','avoided','evaded','eluded','escaped','fled','run','away','off','out','down','up','over','under','through','across','along','around','about','round','throughout','through','via','per','by','means','way','medium','agency','instrument','tool','device','implement','utensil','appliance','machine','mechanism','apparatus','equipment','gear','rigging','tackle','harness','trappings','fittings','fixtures','attachments','accessories','additions','extras','options','choices','alternatives','substitutes','replacements','surrogates','proxies','deputies','agents','representatives','delegates','envoys','emissaries','messengers','couriers','runners','bearers','carriers','porters','conveyors','transmitters','senders','dispatchers','forwarders','shippers','transporters','haulers','carriers','movers','removers','shifters','transferers','transmitters','communicators','informers','notifiers','reporters','informants','sources','authorities','experts','specialists','professionals','practitioners','operators','workers','laborers','toilers','slaves','drudges','menials','servants','attendants','aides','assistants','helpers','auxiliaries','adjuncts','accessories','appendages','additions','supplements','complements','completions','fulfillments','achievements','accomplishments','attainments','realizations','actualizations','materializations','embodiments','incarnations','personifications','representations','depictions','portrayals','renderings','interpretations','performances','executions','enactments','implementations','applications','practices','exercises','operations','proceedings','transactions','dealings','negotiations','bargains','contracts','agreements','treaties','pacts','compacts','conventions','protocols','accords','arrangements','understandings','settlement','resolution','solution','answer','reply','response','reaction','retort','riposte','rejoinder','repartee','comeback','return','feedback','comment','remark','observation','note','annotation','gloss','exegesis','commentary','critique','criticism','review','assessment','evaluation','appraisal','estimate','estimation','calculation','computation','reckoning','counting','tallying','scoring','marking','grading','ranking','rating','classing','classifying','categorizing','grouping','sorting','ordering','arranging','organizing','systematizing','methodizing','standardizing','normalizing','regularizing','stabilizing','steady','stable','firm','solid','sound','secure','safe','protected','guarded','defended','shielded','screened','sheltered','harbored','housed','accommodated','lodged','quartered','billeted','stationed','posted','placed','positioned','located','situated','settled','established','installed','fixed','fastened','attached','affixed','appended','added','annexed','joined','united','connected','linked','coupled','paired','matched','mated','married','wedded','spliced','fused','merged','amalgamated','integrated','incorporated','assimilated','absorbed','digested','taken','received','accepted','admitted','allowed','permitted','granted','given','bestowed','conferred','awarded','presented','offered','proffered','tendered','extended','rendered','provided','supplied','furnished','equipped','outfitted','fitted','suited','adapted','adjusted','modified','altered','changed','turned','converted','transformed','transmuted','metamorphosed','transfigured','renewed','refreshed','revived','restored','reinstated','replaced','substituted','exchanged','swapped','bartered','traded','dealt','handled','managed','directed','controlled','governed','ruled','regulated','administered','operated','run','driven','conducted','led','guided','steered','piloted','navigated','commanded','ordered','commanded','bidden','bidden','bidden','bidden'
]);

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const unique = [...new Set(words)];
  return unique.filter(w => !STOP_WORDS.has(w));
}

function keywordMatchScore(answer: string, rubric: string): number {
  const rubricKeywords = extractKeywords(rubric);
  if (rubricKeywords.length === 0) return 50;

  const answerLower = answer.toLowerCase();
  let matched = 0;
  for (const kw of rubricKeywords) {
    if (answerLower.includes(kw)) matched++;
  }

  return Math.min(100, Math.round((matched / rubricKeywords.length) * 100));
}

export const scoreSession = async (sessionId: string) => {
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { candidate: true, answers: { include: { question: true } }, proctorEvents: true }
  });

  if (!session) throw new Error('Session not found');

  let totalScore = 0;
  let correctCount = 0;

  for (const answer of session.answers) {
    await new Promise(r => setTimeout(r, 500));
    const answerText = answer.answer_text || '';
    const rubric = answer.question.rubric || '';

    let score = 0;
    if (answerText.trim().length === 0) {
      score = 0;
    } else {
      score = keywordMatchScore(answerText, rubric);
    }

    // Consider answer "correct" if score >= 40%
    const isCorrect = score >= 40;
    if (isCorrect) correctCount++;

    const feedback = score > 80
      ? "Excellent answer, covers all key points."
      : score > 60
        ? "Good answer, meets expectations."
        : score > 30
          ? "Partial answer, missing key details."
          : "Poor answer, does not address the question correctly.";

    await prisma.answer.update({
      where: { id: answer.id },
      data: { ai_score: score, ai_feedback: feedback }
    });

    totalScore += score;
  }

  const overall = session.answers.length > 0 ? totalScore / session.answers.length : 0;
  const totalAnswered = session.answers.length;

  // Determine result based on:
  // 1. Face verification
  // 2. Cheating detection
  // 3. At least 7 out of 10 correct answers (if 10 questions answered)
  // 4. Proctoring violations

  const faceVerified = session.face_verified;
  const cheatingDetected = session.cheating_detected;
  const proctoringViolations = session.proctorEvents.filter(
    e => ['NO_FACE', 'MULTIPLE_FACES', 'RESTRICTED_OBJECT', 'FACE_MISMATCH'].includes(e.event_type)
  );

  let result: string | null = null;
  let rejectionReason: string | null = null;
  let rejectionProofs: string | null = null;

  if (cheatingDetected) {
    result = 'rejected';
    rejectionReason = session.cheating_reason || 'Cheating detected during the interview.';
  } else if (!faceVerified) {
    result = 'rejected';
    rejectionReason = 'Face verification failed. The interview person does not match the registered candidate photo.';
    const proofSnapshots = proctoringViolations
      .filter(e => e.snapshot_url)
      .map(e => e.snapshot_url as string);
    rejectionProofs = JSON.stringify(proofSnapshots);
  } else if (totalAnswered < 10) {
    // Did not complete all questions
    result = 'rejected';
    rejectionReason = `Interview incomplete. Only ${totalAnswered} of 10 questions were answered.`;
  } else if (correctCount < 7) {
    // Did not meet the 7/10 correct threshold
    result = 'rejected';
    rejectionReason = `Score too low. You answered ${correctCount} out of 10 questions correctly. Minimum required is 7 correct answers.`;
  } else if (proctoringViolations.length > 0) {
    // Passed score but had proctoring violations - still selected if score is good
    result = 'selected';
    // Note: we keep them selected if they got 7+ correct, but record violations
  } else {
    // All good - selected
    result = 'selected';
  }

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      overall_score: overall,
      correct_count: correctCount,
      result,
      rejection_reason: rejectionReason,
      rejection_proofs: rejectionProofs,
      status: result === 'rejected' ? 'rejected' : 'completed'
    }
  });

  // Send result email automatically
  if (!session.result_email_sent_at) {
    const passed = result === 'selected';
    await sendInterviewResultEmail(session.candidate, overall, correctCount, passed, rejectionReason);
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { result_email_sent_at: new Date() }
    });
  }

  console.log(`Session ${sessionId} scored. Overall: ${overall}%, Correct: ${correctCount}/10, Result: ${result}`);
};
