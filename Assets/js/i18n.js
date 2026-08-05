// ============================================================
// i18n.js – Shared translation system for all pages
// ============================================================

// ─── TRANSLATIONS ────────────────────────────────────────────────
export const TRANSLATIONS = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    campaigns: 'Campaigns',
    applicants: 'Applicants',
    assessments: 'Assessments',
    rankings: 'Rankings',
    interviews: 'Interviews',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    
    // Common
    search: 'Search',
    search_placeholder: 'Search campaigns, applicants...',
    no_results: 'No results found',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    main: 'Main',
    general: 'General',
    new_applicants: 'New Applicants',
    new_campaigns: 'New Campaigns',
    team_activity_feed: 'Team Activity',
    light: 'Light',
    dark: 'Dark',
    sort_filter: 'Sort & Filter',
    sort_by: 'Sort By',
    direction: 'Direction',
    ascending: 'Ascending',
    descending: 'Descending',
    apply: 'Apply',
    clear: 'Clear',
    show_more: 'Show More',
    confirm_logout_message: 'Are you sure you want to logout?',
    yes_logout: 'Yes, Logout',
    all: 'All',
    '1d': '1d',
    '1w': '1w',
    '1m': '1m',
    '6m': '6m',
    '1y': '1y',

    // Login
    login_product_descriptor: 'Applicant Coordination & Evaluation',
    login_hero_title: 'A clearer way to manage recruitment',
    login_hero_intro: 'ACE stands for Applicant Coordination & Evaluation. ACERecruit gives hiring teams one workspace to manage campaigns, review applicants, and understand assessment results.',
    login_feature_assessment: 'Consistent candidate assessment',
    login_feature_ranking: 'Clear rankings and recommendations',
    login_feature_reports: 'Google Sheets applicant imports',
    login_how_title: 'What ACERecruit helps you do',
    login_assessment_title: 'Structured Assessment',
    login_assessment_desc: 'Compare applicants against job criteria with consistent scoring and optional AI-assisted summaries.',
    login_ranking_title: 'Candidate Ranking',
    login_ranking_desc: 'Prioritize applicants using transparent suitability scores and recommendations.',
    login_workflow_title: 'Connected Workflow',
    login_workflow_desc: 'Manage campaigns, applicants, and assessment results in one place.',
    login_reports_title: 'Connected Imports',
    login_reports_desc: 'Use backend-connected Google Sheets to bring campaign applicants into the recruitment workflow.',
    login_footer_descriptor: 'Applicant Coordination & Evaluation Workspace',
    
    // Dashboard
    open_campaigns: 'Open Campaigns',
    applications_received: 'Applications Received',
    awaiting_review: 'Awaiting Review',
    shortlisted: 'Shortlisted',
    avg_suitability_score: 'Avg Suitability Score',
    time_to_fill: 'Time to Fill (days)',
    candidate_recommendations: 'Candidate Recommendations',
    applications_trend: 'Applications Trend',
    application_intake: 'Application Intake',
    recruitment_activity: 'Recruitment activity',
    assessment_quality: 'Assessment quality',
    recommendation_distribution: 'Distribution by recommendation',
    application_volume: 'Application volume',
    applications_over_time: 'Applications received over time',
    assessed_candidates: 'assessed candidates',
    assessed: 'Assessed',
    applications_across: 'applications across',
    active_dates: 'active dates',
    chart_hour_intervals: 'hourly intervals',
    chart_day_intervals: 'days',
    chart_week_intervals: 'weeks',
    chart_month_intervals: 'months',
    no_candidates_period: 'No candidates in this period',
    no_assessment_period: 'No assessment data for this period',
    no_applications_period: 'No applications in this period',
    no_application_period: 'No application data for this period',
    try_another_period: 'Try another date range.',
    active_campaigns: 'Active Campaigns',
    top_ranked_candidates: 'Top Ranked Candidates',
    rank: 'Rank',
    candidate: 'Candidate',
    campaign: 'Campaign',
    score: 'Score',
    recommendation: 'Recommendation',
    status: 'Status',
    actions: 'Actions',
    no_campaigns: 'No active campaigns',
    no_candidates: 'No ranked candidates',
    no_data: 'No data available',
    
    // Applicants
    all_applicants: 'All Applicants',
    name: 'Name',
    position: 'Position',
    experience: 'Experience',
    yrs: 'yrs',
    expected_salary: 'Expected Salary',
    availability: 'Availability',
    no_applicants: 'No applicants found',
    select: 'Select',
    trash: 'Trash',
    move_to_trash: 'Move to Trash',
    restore: 'Restore',
    delete_permanently: 'Delete Permanently',
    empty_trash: 'Empty Trash',
    trashed_applicants: 'Trashed Applicants',
    confirm_trash_title: 'Move to Trash?',
    confirm_trash_message: 'Are you sure you want to move these applicants to trash?',
    applicant_details: 'Applicant Details',
    back_to_applicants: 'Back to Applicants',
    overall_suitability_score: 'Overall Suitability Score',
    ai_summary: 'AI Summary',
    category_scores: 'Category Scores',
    technical_skills_matrix: 'Technical Skills Matrix',
    strengths: 'Strengths',
    weaknesses: 'Weaknesses',
    missing_requirements: 'Missing Requirements',
    transferable_skills: 'Transferable Skills',
    risk_factors: 'Potential Risk Factors',
    interview_questions: 'Suggested Interview Questions',
    final_recommendation: 'Final HR Recommendation',
    add_to_shortlist: 'Add to Shortlist',
    schedule_interview: 'Schedule Interview',
    generate_client_report: 'Generate Client Report',
    compare_with_others: 'Compare with Others',
    view_cv: 'View CV',
    download_cv: 'Download CV',
    
    // Campaigns
    all_campaigns: 'All Campaigns',
    all_statuses: 'All Statuses',
    new_campaign: 'New Campaign',
    create_campaign: 'Create New Campaign',
    campaign_details: 'Campaign Details',
    back_to_campaigns: 'Back to Campaigns',
    client: 'Client',
    job_title: 'Job Title',
    created: 'Created',
    total_applicants: 'Total Applicants',
    job_description: 'Job Description',
    scoring_matrix: 'AI-Generated Scoring Matrix',
    category: 'Category',
    weight: 'Weight (%)',
    review_modify: 'Review & Modify',
    activate_campaign: 'Activate Campaign',
    edit_campaign: 'Edit Campaign',
    upload_criteria_pdf: 'Upload Criteria PDF',
    save_criteria: 'Save Criteria',
    compare_with_applicants: 'Compare with Applicants',
    applicant_match_scores: 'Applicant Match Scores',
    no_campaigns_found: 'No campaigns found',
    
    // Assessments
    total_assessments: 'Total Assessments',
    excellent_match: 'Excellent Match',
    strong_match: 'Strong Match',
    average_score: 'Average Score',
    all_recommendations: 'All Recommendations',
    date: 'Date',
    no_assessments: 'No assessments found',
    new_assessment: 'New Assessment',
    
    // Rankings
    candidate_rankings: 'Candidate Rankings',
    select_campaign: 'Select Campaign',
    load_rankings: 'Load Rankings',
    compare_selected: 'Compare Selected',
    export_rankings: 'Export Rankings',
    no_rankings: 'No candidates found for this campaign',
    
    // Interviews
    interview_tracker: 'Interview Tracker',
    scheduled: 'Scheduled',
    completed: 'Completed',
    pending_feedback: 'Pending Feedback',
    offer_extended: 'Offer Extended',
    interviewer: 'Interviewer',
    date_time: 'Date & Time',
    no_interviews: 'No interviews found',
    schedule_new: 'Schedule Interview',
    
    // Reports
    client_reports: 'Client Reports',
    generated_today: 'Generated Today',
    pending: 'Pending',
    shared: 'Shared',
    generate_report: 'Generate Report',
    report_name: 'Report Name',
    preview: 'Preview',
    clear_selection: 'Clear Selection',
    include_cv: 'Include CV',
    include_cover_letter: 'Include Cover Letter',
    include_recruiter_notes: 'Include Recruiter Notes',
    branding: 'Branding',
    format: 'Report Format',
    standard: 'Standard (ACERecruit)',
    select_candidates: 'Select one or more candidates',
    no_reports: 'No reports found',
    
    // Settings
    settings_title: 'Settings',
    profile: 'Profile',
    preferences: 'Preferences',
    notifications: 'Notifications',
    integrations: 'Integrations',
    calendar: 'Calendar',
    appearance: 'Appearance',
    profile_information: 'Profile Information',
    full_name: 'Full Name',
    email_address: 'Email Address',
    role: 'Role',
    select_role: 'Select role',
    recruiter: 'Recruiter',
    senior_recruiter: 'Senior Recruiter',
    team_lead: 'Team Lead',
    admin: 'Admin',
    save_profile: 'Save Profile',
    general_preferences: 'General Preferences',
    language: 'Language',
    select_language: 'Select language',
    timezone: 'Timezone',
    select_timezone: 'Select timezone',
    date_format: 'Date Format',
    select_format: 'Select format',
    save_preferences: 'Save Preferences',
    notification_preferences: 'Notification Preferences',
    new_applications: 'New Application Received',
    new_applications_desc: 'Receive notifications when a new application is submitted',
    assessment_complete: 'Assessment Complete',
    assessment_complete_desc: 'Receive notifications when AI assessment is complete',
    interview_scheduled_desc: 'Receive notifications when interviews are scheduled',
    report_generated_desc: 'Receive notifications when client reports are generated',
    save_notifications: 'Save Notification Settings',
    api_integrations: 'API & Integrations',
    api_key: 'API Key',
    ai_provider: 'AI Provider',
    select_ai_provider: 'Select AI provider',
    save_integrations: 'Save Integrations',
    calendar_integration: 'Google Calendar Integration',
    calendar_desc: 'Connect your Google Calendar to automatically sync scheduled interviews.',
    connect_calendar: 'Connect Calendar',
    sync_settings: 'Sync Settings',
    auto_sync: 'Auto-sync new interviews',
    reminders: 'Add 15-minute reminders',
    calendar_update: 'Update when interview changes',
    connection_status: 'Connection status',
    account: 'Account',
    auto_sync_desc: 'Automatically create a calendar event after an interview is scheduled.',
    reminders_desc: 'Give recruiters and interviewers time to prepare before the call.',
    calendar_update_desc: 'Keep rescheduled interviews aligned with the calendar event.',
    calendar_frontend_note: 'Frontend preview: OAuth authorization and real Google Calendar event creation will be connected when the backend is available.',
    calendar_selection: 'Calendar Selection',
    connected_account: 'Connected account:',
    not_connected: 'Not connected',
    connected: 'Connected',
    disconnect_calendar: 'Disconnect Calendar',
    test_connection: 'Test Connection',
    sync_now: 'Sync Now',
    appearance_settings: 'Appearance',
    appearance_desc: 'Shape the recruitment workspace around the way your team reviews candidates.',
    layout_density: 'Layout density',
    layout_density_desc: 'Choose how much information fits on screen.',
    comfortable_layout: 'Comfortable',
    comfortable_layout_desc: 'More breathing room and easier scanning.',
    compact_layout: 'Compact',
    light_theme_desc: 'Bright and clear for daytime reviewing.',
    dark_theme_desc: 'Lower glare for long screening sessions.',
    reduce_motion: 'Reduce visual motion',
    reduce_motion_desc: 'Minimize floating effects and decorative animation while reviewing.',
    dark_mode: 'Dark Mode',
    dark_mode_desc: 'Switch between light and dark theme',
    toggle_dark_mode: 'Toggle Dark Mode',
    compact_mode: 'Compact Mode',
    compact_mode_desc: 'Reduce spacing for denser content',
    save_appearance: 'Save Appearance Settings',
    confirm_logout: 'Are you sure you want to logout?',
    
    // Toast messages
    profile_saved: 'Profile saved successfully!',
    preferences_saved: 'Preferences saved successfully!',
    notifications_saved: 'Notification settings saved successfully!',
    integrations_saved: 'Integration settings saved successfully!',
    appearance_saved: 'Appearance settings saved successfully!',
    calendar_connected: 'Calendar connected successfully!',
    calendar_test: 'Calendar connection test: Success!',
    syncing: 'Syncing interviews to Google Calendar...',
    sync_complete: 'Sync complete! 3 interviews synced.',
    auto_sync_enabled: 'Auto-sync enabled',
    auto_sync_disabled: 'Auto-sync disabled',
    reminders_enabled: 'Reminders enabled',
    reminders_disabled: 'Reminders disabled',
    update_enabled: 'Auto-update enabled',
    update_disabled: 'Auto-update disabled',
    language_changed: 'Language changed to',
    timezone_changed: 'Timezone changed to',
    fill_fields: 'Please fill in all required fields.',
    error_loading: 'Error loading data',
    error_saving: 'Error saving data',
    interview_scheduled: 'Interview scheduled for',
    interview_updated: 'Interview updated for',
    applicant_restored: 'Applicant restored.',
    applicant_deleted: 'Applicant permanently deleted.',
    trash_emptied: 'Trash emptied.',
    no_items_selected: 'No items selected.',
    criteria_saved: 'Criteria saved!',
    pdf_extracted: 'PDF text extracted successfully!',
    pdf_error: 'Error extracting PDF text.',
    matrix_updated: 'Scoring matrix updated successfully!',
    matrix_reset: 'Matrix reset to original values.',
    campaign_activated: 'Campaign activated!',
  },
  he: {
    // Navigation
    dashboard: 'לוח בקרה',
    campaigns: 'קמפיינים',
    applicants: 'מועמדים',
    assessments: 'הערכות',
    rankings: 'דירוגים',
    interviews: 'ראיונות',
    reports: 'דוחות',
    settings: 'הגדרות',
    logout: 'התנתק',
    
    // Common
    search: 'חיפוש',
    search_placeholder: 'חיפוש קמפיינים, מועמדים...',
    no_results: 'לא נמצאו תוצאות',
    view: 'צפה',
    edit: 'ערוך',
    delete: 'מחק',
    save: 'שמור',
    cancel: 'ביטול',
    close: 'סגור',
    confirm: 'אשר',
    yes: 'כן',
    no: 'לא',
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    warning: 'אזהרה',
    info: 'מידע',
    main: 'ראשי',
    general: 'כללי',
    new_applicants: 'מועמדים חדשים',
    new_campaigns: 'קמפיינים חדשים',
    team_activity_feed: 'פעילות צוות',
    light: 'בהיר',
    dark: 'כהה',
    sort_filter: 'מיון וסינון',
    sort_by: 'מיין לפי',
    direction: 'כיוון',
    ascending: 'סדר עולה',
    descending: 'סדר יורד',
    apply: 'החל',
    clear: 'נקה',
    show_more: 'הצג עוד',
    confirm_logout_message: 'האם ברצונך להתנתק?',
    yes_logout: 'כן, התנתק',
    all: 'הכול',
    '1d': 'יום',
    '1w': 'שבוע',
    '1m': 'חודש',
    '6m': '6 חודשים',
    '1y': 'שנה',

    // Login
    login_product_descriptor: 'תיאום והערכת מועמדים',
    login_hero_title: 'דרך ברורה יותר לנהל גיוס',
    login_hero_intro: 'ACE הוא קיצור של תיאום והערכת מועמדים. ACERecruit מעניקה לצוותי גיוס סביבת עבודה אחת לניהול קמפיינים, בדיקת מועמדים והבנת תוצאות הערכה.',
    login_feature_assessment: 'הערכת מועמדים עקבית',
    login_feature_ranking: 'דירוגים והמלצות ברורים',
    login_feature_reports: 'ייבוא מועמדים מ-Google Sheets',
    login_how_title: 'מה ACERecruit עוזרת לכם לעשות',
    login_assessment_title: 'הערכה מובנית',
    login_assessment_desc: 'השוו מועמדים לדרישות התפקיד באמצעות ניקוד עקבי וסיכומים בסיוע AI לפי הצורך.',
    login_ranking_title: 'דירוג מועמדים',
    login_ranking_desc: 'תעדפו מועמדים בעזרת ציוני התאמה והמלצות ברורים ושקופים.',
    login_workflow_title: 'תהליך עבודה מחובר',
    login_workflow_desc: 'נהלו קמפיינים, מועמדים ותוצאות הערכה במקום אחד.',
    login_reports_title: 'ייבוא מחובר',
    login_reports_desc: 'השתמשו ב-Google Sheets המחובר לצד השרת כדי לייבא מועמדים לתהליך הגיוס.',
    login_footer_descriptor: 'סביבת עבודה לתיאום והערכת מועמדים',
    
    // Dashboard
    open_campaigns: 'קמפיינים פעילים',
    applications_received: 'מועמדויות שהתקבלו',
    awaiting_review: 'ממתין לבדיקה',
    shortlisted: 'ברשימה הקצרה',
    avg_suitability_score: 'ציון התאמה ממוצע',
    time_to_fill: 'זמן לאיוש (ימים)',
    candidate_recommendations: 'המלצות מועמדים',
    applications_trend: 'מגמת מועמדויות',
    application_intake: 'כניסת מועמדויות',
    recruitment_activity: 'פעילות גיוס',
    assessment_quality: 'איכות ההערכה',
    recommendation_distribution: 'התפלגות לפי המלצה',
    application_volume: 'היקף מועמדויות',
    applications_over_time: 'מועמדויות שהתקבלו לאורך זמן',
    assessed_candidates: 'מועמדים שהוערכו',
    assessed: 'הוערכו',
    applications_across: 'מועמדויות לאורך',
    active_dates: 'תאריכים פעילים',
    chart_hour_intervals: 'מרווחים שעתיים',
    chart_day_intervals: 'ימים',
    chart_week_intervals: 'שבועות',
    chart_month_intervals: 'חודשים',
    no_candidates_period: 'אין מועמדים בתקופה זו',
    no_assessment_period: 'אין נתוני הערכה לתקופה זו',
    no_applications_period: 'אין מועמדויות בתקופה זו',
    no_application_period: 'אין נתוני מועמדויות לתקופה זו',
    try_another_period: 'אפשר לנסות טווח תאריכים אחר.',
    active_campaigns: 'קמפיינים פעילים',
    top_ranked_candidates: 'מועמדים מדורגים',
    rank: 'דירוג',
    candidate: 'מועמד',
    campaign: 'קמפיין',
    score: 'ציון',
    recommendation: 'המלצה',
    status: 'סטטוס',
    actions: 'פעולות',
    no_campaigns: 'אין קמפיינים פעילים',
    no_candidates: 'אין מועמדים מדורגים',
    no_data: 'אין נתונים זמינים',
    
    // Applicants
    all_applicants: 'כל המועמדים',
    name: 'שם',
    position: 'תפקיד',
    experience: 'ניסיון',
    yrs: 'שנים',
    expected_salary: 'שכר מבוקש',
    availability: 'זמינות',
    no_applicants: 'לא נמצאו מועמדים',
    select: 'בחר',
    trash: 'פח',
    move_to_trash: 'העבר לפח',
    restore: 'שחזר',
    delete_permanently: 'מחק לצמיתות',
    empty_trash: 'רוקן פח',
    trashed_applicants: 'מועמדים בפח',
    confirm_trash_title: 'להעביר לפח?',
    confirm_trash_message: 'האם אתה בטוח שברצונך להעביר מועמדים אלה לפח?',
    applicant_details: 'פרטי מועמד',
    back_to_applicants: 'חזרה למועמדים',
    overall_suitability_score: 'ציון התאמה כללי',
    ai_summary: 'סיכום AI',
    category_scores: 'ציוני קטגוריות',
    technical_skills_matrix: 'מטריצת מיומנויות טכניות',
    strengths: 'חוזקות',
    weaknesses: 'חולשות',
    missing_requirements: 'דרישות חסרות',
    transferable_skills: 'מיומנויות ניתנות להעברה',
    risk_factors: 'גורמי סיכון פוטנציאליים',
    interview_questions: 'שאלות ראיון מוצעות',
    final_recommendation: 'המלצת HR סופית',
    add_to_shortlist: 'הוסף לרשימה הקצרה',
    schedule_interview: 'קבע ראיון',
    generate_client_report: 'הפק דוח ללקוח',
    compare_with_others: 'השווה עם אחרים',
    view_cv: 'צפה בקורות חיים',
    download_cv: 'הורד קורות חיים',
    
    // Campaigns
    all_campaigns: 'כל הקמפיינים',
    all_statuses: 'כל הסטטוסים',
    new_campaign: 'קמפיין חדש',
    create_campaign: 'צור קמפיין חדש',
    campaign_details: 'פרטי קמפיין',
    back_to_campaigns: 'חזרה לקמפיינים',
    client: 'לקוח',
    job_title: 'תואר התפקיד',
    created: 'נוצר',
    total_applicants: 'סך מועמדים',
    job_description: 'תיאור התפקיד',
    scoring_matrix: 'מטריצת ניקוד מבוססת AI',
    category: 'קטגוריה',
    weight: 'משקל (%)',
    review_modify: 'עיין ושנה',
    activate_campaign: 'הפעל קמפיין',
    edit_campaign: 'ערוך קמפיין',
    upload_criteria_pdf: 'העלה PDF עם קריטריונים',
    save_criteria: 'שמור קריטריונים',
    compare_with_applicants: 'השווה עם מועמדים',
    applicant_match_scores: 'ציוני התאמת מועמדים',
    no_campaigns_found: 'לא נמצאו קמפיינים',
    
    // Assessments
    total_assessments: 'סך הערכות',
    excellent_match: 'התאמה מעולה',
    strong_match: 'התאמה חזקה',
    average_score: 'ציון ממוצע',
    all_recommendations: 'כל ההמלצות',
    date: 'תאריך',
    no_assessments: 'לא נמצאו הערכות',
    new_assessment: 'הערכה חדשה',
    
    // Rankings
    candidate_rankings: 'דירוגי מועמדים',
    select_campaign: 'בחר קמפיין',
    load_rankings: 'טען דירוגים',
    compare_selected: 'השווה נבחרים',
    export_rankings: 'ייצא דירוגים',
    no_rankings: 'לא נמצאו מועמדים לקמפיין זה',
    
    // Interviews
    interview_tracker: 'מעקב ראיונות',
    scheduled: 'נקבע',
    completed: 'הושלם',
    pending_feedback: 'ממתין למשוב',
    offer_extended: 'הצעה הוגשה',
    interviewer: 'מראיין',
    date_time: 'תאריך ושעה',
    no_interviews: 'לא נמצאו ראיונות',
    schedule_new: 'קבע ראיון',
    
    // Reports
    client_reports: 'דוחות ללקוח',
    generated_today: 'נוצר היום',
    pending: 'ממתין',
    shared: 'שותף',
    generate_report: 'הפק דוח',
    report_name: 'שם הדוח',
    preview: 'תצוגה מקדימה',
    clear_selection: 'נקה בחירה',
    include_cv: 'כלול קורות חיים',
    include_cover_letter: 'כלול מכתב מקדים',
    include_recruiter_notes: 'כלול הערות מגייס',
    branding: 'מותג',
    format: 'פורמט דוח',
    standard: 'סטנדרטי (ACERecruit)',
    select_candidates: 'בחר מועמד אחד או יותר',
    no_reports: 'לא נמצאו דוחות',
    
    // Settings
    settings_title: 'הגדרות',
    profile: 'פרופיל',
    preferences: 'העדפות',
    notifications: 'התראות',
    integrations: 'אינטגרציות',
    calendar: 'לוח שנה',
    appearance: 'מראה',
    profile_information: 'פרטי פרופיל',
    full_name: 'שם מלא',
    email_address: 'כתובת אימייל',
    role: 'תפקיד',
    select_role: 'בחר תפקיד',
    recruiter: 'מגייס',
    senior_recruiter: 'מגייס בכיר',
    team_lead: 'מנהל צוות',
    admin: 'מנהל מערכת',
    save_profile: 'שמור פרופיל',
    general_preferences: 'העדפות כלליות',
    language: 'שפה',
    select_language: 'בחר שפה',
    timezone: 'אזור זמן',
    select_timezone: 'בחר אזור זמן',
    date_format: 'פורמט תאריך',
    select_format: 'בחר פורמט',
    save_preferences: 'שמור העדפות',
    notification_preferences: 'העדפות התראות',
    new_applications: 'התקבלה מועמדות חדשה',
    new_applications_desc: 'קבל התראה כאשר מועמדות חדשה מוגשת',
    assessment_complete: 'הערכה הושלמה',
    assessment_complete_desc: 'קבל התראה כאשר הערכת AI הושלמה',
    interview_scheduled_desc: 'קבל התראה כאשר ראיון נקבע',
    report_generated_desc: 'קבל התראה כאשר דוח ללקוח נוצר',
    save_notifications: 'שמור הגדרות התראות',
    api_integrations: 'API ואינטגרציות',
    api_key: 'מפתח API',
    ai_provider: 'ספק AI',
    select_ai_provider: 'בחר ספק AI',
    save_integrations: 'שמור אינטגרציות',
    calendar_integration: 'אינטגרציית Google Calendar',
    calendar_desc: 'חבר את Google Calendar שלך כדי לסנכרן ראיונות אוטומטית.',
    connect_calendar: 'חבר Calendar',
    sync_settings: 'הגדרות סנכרון',
    auto_sync: 'סנכרון אוטומטי של ראיונות חדשים',
    reminders: 'הוסף תזכורות של 15 דקות',
    calendar_update: 'עדכן כאשר ראיון משתנה',
    connection_status: 'מצב החיבור',
    account: 'חשבון',
    auto_sync_desc: 'צור אירוע ביומן באופן אוטומטי לאחר קביעת ראיון.',
    reminders_desc: 'אפשר למגייסים ולמראיינים להתכונן לפני השיחה.',
    calendar_update_desc: 'שמור ראיונות שנקבעו מחדש מסונכרנים עם האירוע ביומן.',
    calendar_frontend_note: 'תצוגת ממשק: הרשאת OAuth ויצירת אירועים אמיתיים ביומן Google יחוברו כאשר צד השרת יהיה זמין.',
    calendar_selection: 'בחירת לוח שנה',
    connected_account: 'חשבון מחובר:',
    not_connected: 'לא מחובר',
    connected: 'מחובר',
    disconnect_calendar: 'נתק את היומן',
    test_connection: 'בדוק חיבור',
    sync_now: 'סנכרן עכשיו',
    appearance_settings: 'מראה',
    appearance_desc: 'התאם את סביבת הגיוס לאופן שבו הצוות שלך בוחן מועמדים.',
    layout_density: 'צפיפות פריסה',
    layout_density_desc: 'בחר כמה מידע יוצג על המסך.',
    comfortable_layout: 'מרווח',
    comfortable_layout_desc: 'יותר מרווח ונוחות בסריקה.',
    compact_layout: 'קומפקטי',
    light_theme_desc: 'תצוגה בהירה וברורה לעבודה בשעות היום.',
    dark_theme_desc: 'פחות סנוור במהלך מפגשי סינון ארוכים.',
    reduce_motion: 'הפחת תנועה חזותית',
    reduce_motion_desc: 'צמצם אפקטים צפים ואנימציות דקורטיביות בזמן הבדיקה.',
    dark_mode: 'מצב כהה',
    dark_mode_desc: 'החלף בין ערכת נושא בהירה לכהה',
    toggle_dark_mode: 'החלף מצב כהה',
    compact_mode: 'מצב דחוס',
    compact_mode_desc: 'הקטן ריווח לתוכן צפוף יותר',
    save_appearance: 'שמור הגדרות מראה',
    confirm_logout: 'האם אתה בטוח שברצונך להתנתק?',
    
    // Toast messages
    profile_saved: 'הפרופיל נשמר בהצלחה!',
    preferences_saved: 'ההעדפות נשמרו בהצלחה!',
    notifications_saved: 'הגדרות ההתראות נשמרו בהצלחה!',
    integrations_saved: 'הגדרות האינטגרציה נשמרו בהצלחה!',
    appearance_saved: 'הגדרות המראה נשמרו בהצלחה!',
    calendar_connected: 'לוח השנה חובר בהצלחה!',
    calendar_test: 'בדיקת חיבור לוח שנה: הצלחה!',
    syncing: 'מסנכרן ראיונות ל-Google Calendar...',
    sync_complete: 'הסנכרון הושלם! 3 ראיונות סונכרנו.',
    auto_sync_enabled: 'סנכרון אוטומטי הופעל',
    auto_sync_disabled: 'סנכרון אוטומטי הושבת',
    reminders_enabled: 'תזכורות הופעלו',
    reminders_disabled: 'תזכורות הושבתו',
    update_enabled: 'עדכון אוטומטי הופעל',
    update_disabled: 'עדכון אוטומטי הושבת',
    language_changed: 'השפה שונתה ל',
    timezone_changed: 'אזור הזמן שונה ל',
    fill_fields: 'אנא מלא את כל השדות הנדרשים.',
    error_loading: 'שגיאה בטעינת הנתונים',
    error_saving: 'שגיאה בשמירת הנתונים',
    interview_scheduled: 'ראיון נקבע ל',
    interview_updated: 'ראיון עודכן עבור',
    applicant_restored: 'המועמד שוחזר.',
    applicant_deleted: 'המועמד נמחק לצמיתות.',
    trash_emptied: 'הפח רוקן.',
    no_items_selected: 'לא נבחרו פריטים.',
    criteria_saved: 'הקריטריונים נשמרו!',
    pdf_extracted: 'טקסט ה-PDF חולץ בהצלחה!',
    pdf_error: 'שגיאה בחילוץ טקסט PDF.',
    matrix_updated: 'מטריצת הניקוד עודכנה בהצלחה!',
    matrix_reset: 'המטריצה אופסה לערכים המקוריים.',
    campaign_activated: 'הקמפיין הופעל!',
  }
};

// ─── LOCALSTORAGE KEY ──────────────────────────────────────────
const SETTINGS_KEY = 'user_preferences';

// ─── GET LANGUAGE ──────────────────────────────────────────────
export function getLanguage() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.language || 'en';
    }
  } catch (e) {}
  return 'en';
}

// ─── GET TRANSLATIONS FOR CURRENT LANGUAGE ────────────────────
export function getTranslations() {
  const lang = getLanguage();
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

// ─── GET SPECIFIC TRANSLATION ──────────────────────────────────
export function t(key) {
  const lang = getLanguage();
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en?.[key] || key;
}

// ─── APPLY TRANSLATIONS TO PAGE ────────────────────────────────
const originalText = new WeakMap();
const originalPlaceholders = new WeakMap();

export function applyLanguage() {
  const lang = getLanguage();
  const translations = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key] !== undefined) {
      el.textContent = translations[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[key] !== undefined) {
      el.placeholder = translations[key];
    }
  });

  // Translate untagged, exact UI copy too. A number of the older screens were
  // created before data-i18n attributes were introduced, so this keeps the
  // language preference effective across the whole application.
  const englishToKey = new Map(
    Object.entries(TRANSLATIONS.en).map(([key, value]) => [value, key])
  );
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest('script, style, code, pre, [data-i18n], [data-i18n-skip]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!originalText.has(node)) originalText.set(node, node.nodeValue);
    const original = originalText.get(node);
    const trimmed = original.trim();
    const key = englishToKey.get(trimmed);
    node.nodeValue = key && translations[key] !== undefined
      ? original.replace(trimmed, translations[key])
      : original;
  }

  document.querySelectorAll('input[placeholder]:not([data-i18n-placeholder]), textarea[placeholder]:not([data-i18n-placeholder])').forEach(el => {
    if (!originalPlaceholders.has(el)) originalPlaceholders.set(el, el.placeholder);
    const original = originalPlaceholders.get(el);
    const key = englishToKey.get(original.trim());
    el.placeholder = key && translations[key] !== undefined ? translations[key] : original;
  });

  // Hebrew is right-to-left. Individual email addresses, numbers and other
  // bidirectional values continue to render correctly through the browser's
  // Unicode bidi handling.
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.body.classList.toggle('rtl', lang === 'he');

  // Update title
  const titleEl = document.querySelector('title');
  if (titleEl) {
    const pageName = translations[titleEl.dataset.i18nTitle] || titleEl.textContent;
    titleEl.textContent = pageName;
  }

  // Update language dropdown if it exists
  const langDropdown = document.getElementById('language');
  if (langDropdown) {
    const selectedText = langDropdown.querySelector('.selected-text');
    if (selectedText) {
      const langMap = { en: 'English', he: 'עברית' };
      selectedText.textContent = langMap[lang] || 'English';
    }
    // Update active state
    const items = langDropdown.querySelectorAll('.dropdown-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.value === lang);
    });
  }

  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent('languageApplied', { detail: { language: lang } }));

  return lang;
}

// ─── SETUP LANGUAGE OBSERVER ────────────────────────────────────
export function setupLanguageObserver() {
  // Also check when localStorage changes (from other tabs)
  window.addEventListener('storage', function(e) {
    if (e.key === SETTINGS_KEY) {
      applyLanguage();
    }
  });
}
