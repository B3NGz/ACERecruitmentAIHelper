// ============================================================
// dataService.js – ACE Recruitment AI API Data Layer
// ============================================================

const API_BASE_URL = 'https://acerecruitmentai.onrender.com';

let db = null;
let dbLoadPromise = null;


// ============================================================
// AUTH / API HELPER
// ============================================================

function getToken() {
  return localStorage.getItem('token');
}

function redirectToLogin() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  window.location.href = '../Login/login.html';
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    redirectToLogin();
    throw new Error('Authentication required.');
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`
  };

  // Set JSON Content-Type only when sending a normal body.
  // Do not set it for FormData because the browser must create
  // the multipart boundary automatically.
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  // JWT invalid / expired
  if (response.status === 401) {
    redirectToLogin();
    throw new Error('Your session has expired.');
  }

  if (response.status === 403) {
    throw new Error(
      'You do not have permission to perform this action.'
    );
  }

  if (!response.ok) {
    let message =
      `API request failed (${response.status}).`;

    const contentType =
      response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        const errorData = await response.json();

        const validationMessage = errorData?.errors
          ? Object.values(errorData.errors)
              .flat()
              .filter(Boolean)
              .join(' ')
          : '';

        message =
          errorData?.message ||
          validationMessage ||
          errorData?.title ||
          message;
      } else {
        const text = await response.text();

        if (text) {
          message = text;
        }
      }
    } catch {
      // Keep the default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}


// ============================================================
// EMPTY DATABASE STRUCTURE
// ============================================================

function getEmptyDatabase() {
  return {
    campaigns: [],
    applicants: [],
    assessments: [],
    interviews: [],
    reports: [],
    users: [],
    settings: {},
    summary: null
  };
}


// ============================================================
// ID HELPER
// ============================================================

export function sameId(a, b) {
  if (a === null || a === undefined) {
    return false;
  }

  if (b === null || b === undefined) {
    return false;
  }

  return (
    String(a).trim().toLowerCase() ===
    String(b).trim().toLowerCase()
  );
}

export function getRecommendationBadgeClass(value) {
  const recommendation = String(value || '').trim().toLowerCase();
  if (recommendation.includes('not recommended') || recommendation.includes('reject') || recommendation.includes('unsuitable')) return 'badge-not';
  if (recommendation.includes('excellent') || recommendation.includes('exceptional') || recommendation.includes('highly recommended')) return 'badge-excellent';
  // Combined wording such as "Conditional / Strong" stays in the 50/50 state.
  if (recommendation.includes('conditional') || recommendation.includes('worth interviewing') || recommendation.includes('worth interview')) return 'badge-conditional';
  if (recommendation.includes('strong')) return 'badge-strong';
  if (recommendation.includes('possible')) return 'badge-possible';
  return 'badge-neutral';
}

export function getStatusBadgeClass(value) {
  const status = String(value || '').trim().toLowerCase();
  const classes = {
    active: 'badge-active',
    completed: 'badge-completed',
    shared: 'badge-shared',
    shortlisted: 'badge-shortlisted',
    scheduled: 'badge-scheduled',
    interviewed: 'badge-interviewed',
    'offer extended': 'badge-offer',
    'pending feedback': 'badge-pending',
    pending: 'badge-pending',
    'under review': 'badge-review',
    'awaiting interview': 'badge-awaiting',
    draft: 'badge-draft',
    inactive: 'badge-inactive',
    closed: 'badge-closed',
    rejected: 'badge-rejected'
  };
  return classes[status] || 'badge-neutral';
}

function unwrapCollection(result) {
  if (Array.isArray(result)) return result;

  return [
    result?.$values,
    result?.items,
    result?.data,
    result?.results,
    result?.value,
    result?.spreadsheets
  ]
    .find(Array.isArray) || [];
}

function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toArray(value) {
  const parsed = parseJson(value, value);
  if (Array.isArray(parsed)) return parsed;

  return parsed === null || parsed === undefined || parsed === ''
    ? []
    : [String(parsed)];
}

function getObjectValue(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return undefined;
}

function normalizeDateValue(value) {
  if (value === null || value === undefined || value === '') return null;

  const numericValue = typeof value === 'number'
    ? value
    : (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim())
      ? Number(value)
      : null);

  // Excel/Google Sheets serial dates use 1899-12-30 as day zero.
  if (numericValue !== null && numericValue >= 1 && numericValue < 100000) {
    return new Date(Date.UTC(1899, 11, 30) + numericValue * 86400000).toISOString();
  }

  return value;
}


// ============================================================
// NORMALIZE CAMPAIGN
// ============================================================

function normalizeCampaign(campaign) {
  if (!campaign) {
    return null;
  }

  const id =
    campaign.id ??
    campaign.campaignID ??
    campaign.campaignId ??
    campaign.CampaignID ??
    campaign.CampaignId ??
    '';

  const requirementDocumentUrl =
    campaign.requirementDocumentUrl ??
    campaign.RequirementDocumentUrl ??
    null;

  return {
    ...campaign,

    id,

    campaignId: id,

    jobTitle:
      campaign.jobTitle ??
      campaign.JobTitle ??
      '',

    clientName:
      campaign.clientName ??
      campaign.ClientName ??
      '',

    jobDescription:
      campaign.jobDescription ??
      campaign.JobDescription ??
      '',

    status:
      campaign.status ??
      campaign.Status ??
      '',

    googleSheetID:
      campaign.googleSheetID ??
      campaign.googleSheetId ??
      campaign.GoogleSheetID ??
      campaign.GoogleSheetId ??
      '',

    googleSheetName:
      campaign.googleSheetName ??
      campaign.GoogleSheetName ??
      '',

    createdBy:
      campaign.createdBy ??
      campaign.CreatedBy ??
      '',

    createdDate:
      campaign.createdDate ??
      campaign.CreatedDate ??
      campaign.createdAt ??
      campaign.CreatedAt ??
      null,

    lastRowProcessed: Number(
      campaign.lastRowProcessed ??
      campaign.LastRowProcessed ??
      0
    ),

    requirementDocumentFileId:
      campaign.requirementDocumentFileId ??
      campaign.RequirementDocumentFileId ??
      null,

    requirementDocumentName:
      campaign.requirementDocumentName ??
      campaign.RequirementDocumentName ??
      null,

    requirementDocumentUrl,

    requirements: parseJson(requirementDocumentUrl, null)
  };
}


// ============================================================
// NORMALIZE APPLICANT
// ============================================================

function normalizeApplicant(applicant) {
  if (!applicant) {
    return null;
  }

  const id =
    applicant.id ??
    applicant.applicantID ??
    applicant.applicantId ??
    applicant.ApplicantID ??
    applicant.ApplicantId ??
    '';

  const campaignId =
    applicant.campaignID ??
    applicant.campaignId ??
    applicant.CampaignID ??
    applicant.CampaignId ??
    '';

  const otherFormAnswersRaw =
    applicant.otherFormAnswers ??
    applicant.OtherFormAnswers ??
    null;

  const linkedIn =
    applicant.linkedIn ??
    applicant.linkedin ??
    applicant.LinkedIn ??
    '';

  const documentsRaw =
    applicant.documents ??
    applicant.Documents ??
    applicant.applicantDocuments ??
    applicant.ApplicantDocuments ??
    [];
  const documents = unwrapCollection(documentsRaw)
    .filter(document =>
      (!getObjectValue(document, 'applicantID', 'applicantId', 'ApplicantID', 'ApplicantId') ||
        sameId(getObjectValue(document, 'applicantID', 'applicantId', 'ApplicantID', 'ApplicantId'), id)) &&
      (!getObjectValue(document, 'campaignID', 'campaignId', 'CampaignID', 'CampaignId') ||
        sameId(getObjectValue(document, 'campaignID', 'campaignId', 'CampaignID', 'CampaignId'), campaignId))
    );
  const findDocument = type => documents
    .filter(document =>
      String(document.documentType ?? document.DocumentType ?? '')
        .trim()
        .toLowerCase() === type
    )
    .sort((a, b) => String(
      b.documentID ?? b.documentId ?? b.DocumentID ?? ''
    ).localeCompare(String(
      a.documentID ?? a.documentId ?? a.DocumentID ?? ''
    ), undefined, { numeric: true }))[0];
  const resumeDocument = findDocument('resume');
  const portfolioDocument = findDocument('portfolio');
  const documentUrl = document => document?.fileUrl ?? document?.FileUrl ?? '';
  const cvUrl =
    applicant.cvUrl ?? applicant.CvUrl ??
    applicant.resumeUrl ?? applicant.ResumeUrl ??
    applicant.cvPath ?? applicant.CvPath ??
    (String(applicant.documentType ?? applicant.DocumentType ?? '').toLowerCase() === 'resume'
      ? applicant.fileUrl ?? applicant.FileUrl
      : undefined) ??
    documentUrl(resumeDocument);
  const portfolio =
    applicant.portfolio ?? applicant.Portfolio ??
    applicant.portfolioUrl ?? applicant.PortfolioUrl ??
    documentUrl(portfolioDocument);

  const createdDate = normalizeDateValue(
    applicant.createdDate ??
    applicant.CreatedDate ??
    applicant.createdAt ??
    applicant.CreatedAt ??
    null
  );

  const receivedDate = normalizeDateValue(
    applicant.receivedDate ??
    applicant.ReceivedDate ??
    null
  );

  // The application timestamp originates in the connected Google Form/Sheet.
  // Keep it separate from CreatedDate, which is when the backend row was saved.
  const applicationDate = normalizeDateValue(
    applicant.applicationDate ??
    applicant.ApplicationDate ??
    applicant.submissionDate ??
    applicant.SubmissionDate ??
    applicant.submittedDate ??
    applicant.SubmittedDate ??
    applicant.submittedAt ??
    applicant.SubmittedAt ??
    applicant.timestamp ??
    applicant.Timestamp ??
    null
  );

  return {
    ...applicant,

    id,

    applicantId: id,

    campaignId,

    firstName:
      applicant.firstName ??
      applicant.FirstName ??
      '',

    fullName:
      applicant.fullName ??
      applicant.FullName ??
      '',

    email:
      applicant.email ??
      applicant.Email ??
      '',

    phone:
      applicant.phone ??
      applicant.Phone ??
      '',

    country:
      applicant.country ??
      applicant.Country ??
      '',

    currentPosition:
      applicant.currentPosition ??
      applicant.CurrentPosition ??
      '',

    yearsExperience:
      applicant.yearsExperience ??
      applicant.YearsExperience ??
      0,

    linkedIn,

    linkedin: linkedIn,

    documents,

    cvUrl,

    portfolio,

    expectedSalary:
      applicant.expectedSalary ??
      applicant.ExpectedSalary ??
      '',

    availability:
      applicant.availability ??
      applicant.Availability ??
      '',

    otherFormAnswers: parseJson(otherFormAnswersRaw, {}),

    otherFormAnswersRaw,

    status:
      applicant.status ??
      applicant.Status ??
      '',

    aiProcessed:
      applicant.aiProcessed ??
      applicant.AiProcessed ??
      false,

    createdDate,

    createdAt: createdDate,

    receivedDate,

    applicationDate,

    submittedAt: applicationDate
  };
}


// ============================================================
// NORMALIZE ASSESSMENT
// ============================================================

function normalizeAssessment(assessment) {
  if (!assessment) {
    return null;
  }

  const id =
    assessment.id ??
    assessment.assessmentID ??
    assessment.assessmentId ??
    assessment.AssessmentID ??
    assessment.AssessmentId ??
    '';

  const applicantId =
    assessment.applicantID ??
    assessment.applicantId ??
    assessment.ApplicantID ??
    assessment.ApplicantId ??
    '';

  const campaignId =
    assessment.campaignID ??
    assessment.campaignId ??
    assessment.CampaignID ??
    assessment.CampaignId ??
    '';

  const aiJsonResultRaw =
    assessment.aiJsonResult ??
    assessment.AIJsonResult ??
    assessment.AiJsonResult ??
    null;
  const aiJsonResult = parseJson(aiJsonResultRaw, {});
  const assessedDate =
    assessment.assessedDate ??
    assessment.AssessedDate ??
    null;
  const executiveSummary =
    assessment.executiveSummary ??
    assessment.ExecutiveSummary ??
    assessment.summary ??
    assessment.Summary ??
    getObjectValue(aiJsonResult, 'executiveSummary', 'ExecutiveSummary', 'summary', 'Summary') ??
    '';
  const skillsScore = Number(assessment.skillsScore ?? assessment.SkillsScore ?? 0);
  const experienceScore = Number(assessment.experienceScore ?? assessment.ExperienceScore ?? 0);
  const qualificationsScore = Number(assessment.qualificationsScore ?? assessment.QualificationsScore ?? 0);
  const languageScore = Number(assessment.languageScore ?? assessment.LanguageScore ?? 0);
  const strengths = toArray(
    assessment.strengths ??
    assessment.Strengths ??
    getObjectValue(aiJsonResult, 'strengths', 'Strengths')
  );
  const gaps = toArray(
    assessment.gaps ??
    assessment.Gaps ??
    assessment.weaknesses ??
    assessment.Weaknesses ??
    getObjectValue(aiJsonResult, 'gaps', 'Gaps', 'weaknesses', 'Weaknesses')
  );
  const categoryScores = parseJson(
    assessment.categoryScores ??
    assessment.CategoryScores ??
    getObjectValue(aiJsonResult, 'categoryScores', 'CategoryScores'),
    null
  ) || {
    Skills: skillsScore,
    Experience: experienceScore,
    Qualifications: qualificationsScore,
    Language: languageScore
  };

  return {
    ...assessment,

    id,

    assessmentId: id,

    applicantId,

    campaignId,

    overallScore:
      Number(
        assessment.overallScore ??
        assessment.OverallScore ??
        0
      ),

    skillsScore,

    experienceScore,

    qualificationsScore,

    languageScore,

    recommendation:
      assessment.recommendation ??
      assessment.Recommendation ??
      'Not Assessed',

    executiveSummary,

    categoryScores,

    skillsMatrix: toArray(
      assessment.skillsMatrix ??
      assessment.SkillsMatrix ??
      getObjectValue(aiJsonResult, 'skillsMatrix', 'SkillsMatrix')
    ),

    strengths,

    gaps,

    weaknesses: gaps,

    missingRequirements: toArray(
      assessment.missingRequirements ??
      assessment.MissingRequirements ??
      getObjectValue(aiJsonResult, 'missingRequirements', 'MissingRequirements')
    ),

    transferableSkills: toArray(
      assessment.transferableSkills ??
      assessment.TransferableSkills ??
      getObjectValue(aiJsonResult, 'transferableSkills', 'TransferableSkills')
    ),

    riskFactors: toArray(
      assessment.riskFactors ??
      assessment.RiskFactors ??
      getObjectValue(aiJsonResult, 'riskFactors', 'RiskFactors')
    ),

    interviewQuestions: toArray(
      assessment.interviewQuestions ??
      assessment.InterviewQuestions ??
      getObjectValue(aiJsonResult, 'interviewQuestions', 'InterviewQuestions')
    ),

    finalRecommendation:
      assessment.finalRecommendation ??
      assessment.FinalRecommendation ??
      getObjectValue(aiJsonResult, 'finalRecommendation', 'FinalRecommendation') ??
      '',

    summary: executiveSummary,

    aiJsonResult,

    aiJsonResultRaw,

    assessedDate,

    createdAt: assessedDate,

    assessedBy:
      assessment.assessedBy ??
      assessment.AssessedBy ??
      null
  };
}


// ============================================================
// LOAD DATABASE
// ============================================================

async function fetchDatabase() {
  try {
    const [
      campaignsResult,
      applicantsResult,
      assessmentsResult,
      summaryResult
    ] = await Promise.all([
      apiFetch('/api/Campaign'),
      apiFetch('/api/Applicant'),
      apiFetch('/api/ApplicantAssessment'),
      apiFetch('/api/Dashboard/summary')
    ]);

    db = getEmptyDatabase();

    db.campaigns = unwrapCollection(campaignsResult)
      .map(normalizeCampaign)
      .filter(Boolean);

    db.applicants = unwrapCollection(applicantsResult)
      .map(normalizeApplicant)
      .filter(Boolean);

    db.assessments = unwrapCollection(assessmentsResult)
      .map(normalizeAssessment)
      .filter(Boolean);

    db.summary =
      summaryResult ?? null;

    console.log(
      '✅ ACE Recruitment API data loaded',
      {
        campaigns: db.campaigns.length,
        applicants: db.applicants.length,
        assessments: db.assessments.length
      }
    );

    return db;
  } catch (error) {
    console.error(
      '❌ Failed to load ACE Recruitment API data:',
      error
    );

    throw error;
  }
}

export async function loadDatabase(forceRefresh = false) {
  if (db && !forceRefresh) return db;
  if (dbLoadPromise && !forceRefresh) return dbLoadPromise;

  dbLoadPromise = fetchDatabase();

  try {
    return await dbLoadPromise;
  } finally {
    dbLoadPromise = null;
  }
}


// ============================================================
// CACHE
// ============================================================

export function clearDatabaseCache() {
  db = null;
  dbLoadPromise = null;
}

export async function refreshDatabase() {
  clearDatabaseCache();

  return loadDatabase(true);
}


// ============================================================
// DASHBOARD
// ============================================================

export async function getDashboardSummary() {
  return apiFetch('/api/Dashboard/summary');
}


// ============================================================
// GOOGLE DRIVE
// ============================================================

export async function getGoogleDriveSpreadsheets() {
  const result = await apiFetch('/api/GoogleDrive/spreadsheets');

  return unwrapCollection(result)
    .map(spreadsheet => {
      if (typeof spreadsheet === 'string') {
        return { id: spreadsheet, name: '' };
      }

      const id =
        spreadsheet.id ??
        spreadsheet.spreadsheetId ??
        spreadsheet.sheetId ??
        spreadsheet.googleSheetID ??
        spreadsheet.googleSheetId ??
        spreadsheet.value ??
        '';
      const name =
        spreadsheet.name ??
        spreadsheet.title ??
        spreadsheet.spreadsheetName ??
        spreadsheet.googleSheetName ??
        spreadsheet.text ??
        '';

      return { id: String(id), name: String(name) };
    })
    .filter(spreadsheet => spreadsheet.id);
}


// ============================================================
// CAMPAIGNS
// ============================================================

export async function getCampaigns() {
  const data = await loadDatabase();

  return data?.campaigns || [];
}


export async function getActiveCampaigns() {
  const campaigns = await getCampaigns();

  return campaigns.filter(
    campaign =>
      String(campaign.status || '')
        .trim()
        .toLowerCase() === 'active'
  );
}


export async function getCampaignById(id) {
  if (!id) {
    return null;
  }

  const result = await apiFetch(
    `/api/Campaign/${encodeURIComponent(id)}`
  );

  return normalizeCampaign(result);
}


export async function getCampaignNames() {
  const campaigns = await getCampaigns();

  return campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.jobTitle,
    client: campaign.clientName
  }));
}

function toCampaignRequest(campaign = {}) {
  return {
    clientName: campaign.clientName ?? campaign.ClientName,
    jobTitle: campaign.jobTitle ?? campaign.JobTitle,
    jobDescription: campaign.jobDescription ?? campaign.JobDescription,
    googleSheetID:
      campaign.googleSheetID ?? campaign.googleSheetId ?? campaign.GoogleSheetID,
    googleSheetName: campaign.googleSheetName ?? campaign.GoogleSheetName,
    status: campaign.status ?? campaign.Status,
    createdBy: campaign.createdBy ?? campaign.CreatedBy
  };
}


export async function createCampaign(campaign) {
  const result = await apiFetch(
    '/api/Campaign',
    {
      method: 'POST',

      body: JSON.stringify(toCampaignRequest(campaign))
    }
  );

  clearDatabaseCache();

  return normalizeCampaign(result);
}


export async function updateCampaign(id, campaign) {
  const result = await apiFetch(
    `/api/Campaign/${encodeURIComponent(id)}`,
    {
      method: 'PUT',

      body: JSON.stringify(toCampaignRequest(campaign))
    }
  );

  clearDatabaseCache();

  return normalizeCampaign(result);
}


export async function deleteCampaign(id) {
  const result = await apiFetch(
    `/api/Campaign/${encodeURIComponent(id)}`,
    {
      method: 'DELETE'
    }
  );

  clearDatabaseCache();

  return result;
}


export async function processCampaignApplicants(campaignId) {
  const result = await apiFetch(
    `/api/Campaign/${encodeURIComponent(
      campaignId
    )}/process-applicants`,
    {
      method: 'POST'
    }
  );

  clearDatabaseCache();

  return result;
}


// ============================================================
// APPLICANTS
// ============================================================

export async function getApplicants() {
  const data = await loadDatabase();

  return data?.applicants || [];
}


export async function getApplicantsByCampaign(campaignId) {
  const applicants = await getApplicants();

  return applicants.filter(
    applicant =>
      sameId(
        applicant.campaignId,
        campaignId
      )
  );
}


export async function getApplicantById(id) {
  if (!id) {
    return null;
  }

  const result = await apiFetch(
    `/api/Applicant/${encodeURIComponent(id)}`
  );

  const applicantPayload =
    result?.applicant ??
    result?.Applicant ??
    result?.item ??
    result?.data ??
    result;
  const responseDocuments =
    result?.documents ??
    result?.Documents ??
    result?.applicantDocuments ??
    result?.ApplicantDocuments;

  return normalizeApplicant(responseDocuments
    ? { ...applicantPayload, applicantDocuments: responseDocuments }
    : applicantPayload);
}

function toApplicantRequest(applicant = {}) {
  const otherFormAnswers =
    applicant.otherFormAnswersRaw ??
    applicant.otherFormAnswers ??
    applicant.OtherFormAnswers;

  return {
    campaignID:
      applicant.campaignID ?? applicant.campaignId ?? applicant.CampaignID,
    firstName: applicant.firstName ?? applicant.FirstName,
    fullName: applicant.fullName ?? applicant.FullName,
    email: applicant.email ?? applicant.Email,
    phone: applicant.phone ?? applicant.Phone,
    country: applicant.country ?? applicant.Country,
    currentPosition: applicant.currentPosition ?? applicant.CurrentPosition,
    yearsExperience: applicant.yearsExperience ?? applicant.YearsExperience,
    linkedIn: applicant.linkedIn ?? applicant.linkedin ?? applicant.LinkedIn,
    expectedSalary: applicant.expectedSalary ?? applicant.ExpectedSalary,
    availability: applicant.availability ?? applicant.Availability,
    otherFormAnswers:
      typeof otherFormAnswers === 'string'
        ? otherFormAnswers
        : JSON.stringify(otherFormAnswers ?? {}),
    status: applicant.status ?? applicant.Status,
    aiProcessed: applicant.aiProcessed ?? applicant.AiProcessed,
    receivedDate: applicant.receivedDate ?? applicant.ReceivedDate
  };
}


export async function createApplicant(applicant) {
  const result = await apiFetch(
    '/api/Applicant',
    {
      method: 'POST',

      body: JSON.stringify(toApplicantRequest(applicant))
    }
  );

  clearDatabaseCache();

  return normalizeApplicant(result);
}


export async function updateApplicant(id, applicant) {
  const result = await apiFetch(
    `/api/Applicant/${encodeURIComponent(id)}`,
    {
      method: 'PUT',

      body: JSON.stringify(toApplicantRequest(applicant))
    }
  );

  clearDatabaseCache();

  return normalizeApplicant(result);
}


export async function deleteApplicant(id) {
  const result = await apiFetch(
    `/api/Applicant/${encodeURIComponent(id)}`,
    {
      method: 'DELETE'
    }
  );

  clearDatabaseCache();

  return result;
}


// ============================================================
// ASSESSMENTS
// ============================================================

export async function getAssessments() {
  const data = await loadDatabase();

  return data?.assessments || [];
}


export async function getAssessmentsByCampaign(
  campaignId
) {
  const assessments =
    await getAssessments();

  return assessments.filter(
    assessment =>
      sameId(
        assessment.campaignId,
        campaignId
      )
  );
}


export async function getAssessmentByApplicant(
  applicantId
) {
  const assessments =
    await getAssessments();

  return (
    assessments.find(
      assessment =>
        sameId(
          assessment.applicantId,
          applicantId
        )
    ) || null
  );
}


export async function getAssessmentByApplicantAndCampaign(
  applicantId,
  campaignId
) {
  if (!applicantId || !campaignId) {
    return null;
  }

  try {
    const result = await apiFetch(
      `/api/ApplicantAssessment/${
        encodeURIComponent(applicantId)
      }/${
        encodeURIComponent(campaignId)
      }`
    );

    return normalizeAssessment(result);
  } catch (error) {
    console.error(
      'Failed to load applicant assessment:',
      error
    );

    return null;
  }
}


// ============================================================
// INTERVIEWS
// ============================================================

export async function getInterviews() {
  const data = await loadDatabase();

  return data?.interviews || [];
}


export async function getInterviewsByCampaign(
  campaignId
) {
  const interviews =
    await getInterviews();

  return interviews.filter(
    interview =>
      sameId(
        interview.campaignId ??
        interview.campaignID,
        campaignId
      )
  );
}


export async function getInterviewStats() {
  const interviews =
    await getInterviews();

  return {
    scheduled:
      interviews.filter(
        interview =>
          interview.status ===
          'Scheduled'
      ).length,

    completed:
      interviews.filter(
        interview =>
          interview.status ===
          'Completed'
      ).length,

    pendingFeedback:
      interviews.filter(
        interview =>
          interview.status ===
          'Pending Feedback'
      ).length,

    offerExtended:
      interviews.filter(
        interview =>
          interview.status ===
          'Offer Extended'
      ).length
  };
}


// ============================================================
// REPORTS
// ============================================================

export async function getReports() {
  const data = await loadDatabase();

  return data?.reports || [];
}


export async function getReportStats() {
  const reports =
    await getReports();

  const today =
    new Date()
      .toISOString()
      .split('T')[0];

  return {
    total:
      reports.length,

    generatedToday:
      reports.filter(
        report =>
          report.dateGenerated === today
      ).length,

    pending:
      reports.filter(
        report =>
          report.status === 'Pending' ||
          report.status === 'Draft'
      ).length,

    shared:
      reports.filter(
        report =>
          report.status === 'Shared'
      ).length
  };
}


// ============================================================
// RANKINGS
// ============================================================

export async function getRankedApplicants(
  campaignId
) {
  const data =
    await loadDatabase();

  if (!data) {
    return [];
  }

  let applicants =
    data.applicants || [];

  const assessments =
    data.assessments || [];

  const campaigns =
    data.campaigns || [];


  // Filter applicants by campaign if requested.
  if (
    campaignId &&
    campaignId !== 'all' &&
    campaignId !== ''
  ) {
    applicants =
      applicants.filter(
        applicant =>
          sameId(
            applicant.campaignId,
            campaignId
          )
      );
  }


  const ranked =
    applicants.map(applicant => {

      // Find assessment belonging to BOTH
      // this applicant and this campaign.
      const assessment =
        assessments.find(
          item =>
            sameId(
              item.applicantId,
              applicant.id
            ) &&
            sameId(
              item.campaignId,
              applicant.campaignId
            )
        );


      // Find campaign information.
      const campaign =
        campaigns.find(
          item =>
            sameId(
              item.id,
              applicant.campaignId
            )
        );


      return {
        ...applicant,

        assessment:
          assessment || null,

        campaignName:
          campaign?.jobTitle ||
          'Unknown',

        score:
          Number(
            assessment?.overallScore ??
            0
          ),

        recommendation:
          assessment?.recommendation ||
          'Not Assessed'
      };
    });


  // Highest score first.
  return ranked.sort(
    (a, b) =>
      Number(b.score || 0) -
      Number(a.score || 0)
  );
}


// ============================================================
// RECOMMENDATION OPTIONS
// ============================================================

export function getRecommendationOptions() {
  return [
    {
      value: 'all',
      label: 'All Recommendations'
    },

    {
      value: 'Excellent Match',
      label: 'Excellent Match'
    },

    {
      value: 'Strong Match',
      label: 'Strong Match'
    },

    {
      value: 'Worth Interviewing',
      label: 'Worth Interviewing'
    },

    {
      value: 'Possible Fit',
      label: 'Possible Fit'
    },

    {
      value: 'Not Recommended',
      label: 'Not Recommended'
    }
  ];
}


// ============================================================
// CAMPAIGN STATUS OPTIONS
// ============================================================

export function getStatusOptions() {
  return [
    {
      value: 'all',
      label: 'All Statuses'
    },

    {
      value: 'active',
      label: 'Active'
    },

    {
      value: 'inactive',
      label: 'Inactive'
    }
  ];
}


// ============================================================
// INTERVIEW STATUS OPTIONS
// ============================================================

export function getInterviewStatusOptions() {
  return [
    {
      value: 'all',
      label: 'All Statuses'
    },

    {
      value: 'Scheduled',
      label: 'Scheduled'
    },

    {
      value: 'Completed',
      label: 'Completed'
    },

    {
      value: 'Pending Feedback',
      label: 'Pending Feedback'
    },

    {
      value: 'Offer Extended',
      label: 'Offer Extended'
    },

    {
      value: 'Rejected',
      label: 'Rejected'
    }
  ];
}


// ============================================================
// ANIMATED COUNTER
// ============================================================

let counterManager = {
  counters: [],
  animationId: null,
  isRunning: false
};


export function animateCounter(
  element,
  target,
  duration = 600
) {
  if (!element) {
    return;
  }

  target = Number(target);

  if (!Number.isFinite(target)) {
    element.textContent = '0';
    return;
  }

  if (target === 0) {
    element.textContent = '0';
    return;
  }


  counterManager.counters.push({
    el: element,

    target,

    startValue: 0,

    startTime:
      performance.now(),

    duration,

    currentValue: 0
  });


  if (!counterManager.isRunning) {
    counterManager.isRunning = true;

    runCounterLoop();
  }
}


function runCounterLoop() {
  if (counterManager.animationId) {
    cancelAnimationFrame(
      counterManager.animationId
    );

    counterManager.animationId = null;
  }


  function update() {
    const now =
      performance.now();

    let anyActive = false;


    for (
      let i =
        counterManager.counters.length - 1;
      i >= 0;
      i--
    ) {
      const counter =
        counterManager.counters[i];


      const progress =
        Math.min(
          (
            now -
            counter.startTime
          ) /
          counter.duration,

          1
        );


      const eased =
        1 -
        Math.pow(
          1 - progress,
          2
        );


      const current =
        Math.floor(
          counter.startValue +
          (
            counter.target -
            counter.startValue
          ) *
          eased
        );


      counter.el.textContent =
        current;

      counter.currentValue =
        current;


      if (progress < 1) {
        anyActive = true;
      } else {
        counter.el.textContent =
          counter.target;

        counterManager.counters.splice(
          i,
          1
        );
      }
    }


    if (
      anyActive &&
      counterManager.counters.length > 0
    ) {
      counterManager.animationId =
        requestAnimationFrame(
          update
        );
    } else {
      counterManager.isRunning =
        false;

      counterManager.animationId =
        null;


      counterManager.counters.forEach(
        counter => {
          counter.el.textContent =
            counter.target;
        }
      );


      counterManager.counters = [];
    }
  }


  counterManager.animationId =
    requestAnimationFrame(
      update
    );
}
