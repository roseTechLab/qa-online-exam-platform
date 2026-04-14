export const defaultExam = {
  title: 'Junior QA Knowledge Check – QA Standards & Pyypl App',
  description:
    'A simple online exam for junior QA testers covering QA standards, smoke/sanity/regression, and realistic Pyypl-style flows.',
  durationMinutes: 20,
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      type: 'mcq',
      category: 'QA Standards',
      question: 'Which testing type is usually done first to check whether the main build is stable enough for deeper testing?',
      options: ['Regression Testing', 'Smoke Testing', 'Exploratory Testing', 'UAT'],
      correctAnswer: 'Smoke Testing'
    },
    {
      id: 'q2',
      type: 'mcq',
      category: 'Pyypl App',
      question: 'If OTP login is failing after a new release, what should a junior QA verify first?',
      options: [
        'Only the app icon and splash screen',
        'Critical login flow, OTP trigger, resend, timeout, and error handling',
        'Every setting in every module',
        'Only the About page'
      ],
      correctAnswer: 'Critical login flow, OTP trigger, resend, timeout, and error handling'
    },
    {
      id: 'q3',
      type: 'essay',
      category: 'Regression',
      question: 'A fix was released for Card Management > Unfreeze Card. Explain what regression areas you would test around this fix in the Pyypl app.',
      sampleAnswer: 'Check status updates, card controls, dashboard visibility, transaction restrictions, notifications, API responses, and device consistency.'
    }
  ]
};
