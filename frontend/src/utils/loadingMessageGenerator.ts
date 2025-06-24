interface MessageGeneratorParams {
  jobTitle?: string;
  companyName?: string;
  userName?: string;
}

export const generateLoadingMessage = ({
  jobTitle = 'a new role',
  companyName = 'a new company',
  userName = 'agent',
}: MessageGeneratorParams): string => {
  const templates = [
    `Alright, ${userName}, let's get this bread. Tailoring your resume for the ${jobTitle} role at ${companyName}.`,
    `Warming up the sewing machine for your ${jobTitle} application. This one's gonna be a perfect fit for ${companyName}.`,
    `Let's make you look sharp, ${userName}. Stitching together the ultimate resume for ${companyName}.`,
    `Measuring twice, cutting once. Your application for the ${jobTitle} position is in good hands.`,
    `Time to thread the needle, ${userName}. Crafting a bespoke resume for the ${jobTitle} role at ${companyName}.`,
    `No wrinkles in this plan. Smoothing out the details for your application to ${companyName}.`,
    `This resume is about to be the talk of the town at ${companyName}. Getting it ready for you, ${userName}.`,
    `We're not just tailoring resumes, we're weaving career dreams. Your ${jobTitle} application is next.`,
    `Let's add a little flair. Polishing your resume for the ${jobTitle} role at ${companyName}.`,
    `The master tailors are at work, ${userName}. Your application for ${companyName} will be ready in a jiffy.`,
    `This isn't just a resume, it's a masterpiece. Crafting it now for the ${jobTitle} position.`,
    `We've got the pattern for success. Applying it to your resume for ${companyName}.`,
    `A perfect fit is our promise. Tailoring your skills to the ${jobTitle} role at ${companyName}.`,
    `The best-dressed applicant wins. Getting your resume ready for the big day at ${companyName}, ${userName}.`,
    `Let's make sure you stand out, ${userName}. Highlighting your best assets for the ${jobTitle} role.`,
    `From fabric to fabulous. Your resume for ${companyName} is undergoing a major transformation.`,
    `The art of the first impression is in the details. We're perfecting them for your ${jobTitle} application.`,
    `This resume is going to be legendary. Just a few more stitches for the ${jobTitle} role at ${companyName}.`,
    `We're on it, ${userName}! Your resume is getting the full bespoke treatment for ${companyName}.`,
    `The perfect resume is a powerful suit of armor. We're forging yours for the ${jobTitle} position.`,
    `Let's make some magic happen, ${userName}. Your application for ${companyName} is our top priority.`,
    `The secret to success is a well-tailored resume. We're crafting yours for the ${jobTitle} role.`,
    `Your career is about to get a major upgrade. Prepping your resume for ${companyName}.`,
    `We're in the business of making you look good, ${userName}. Your ${jobTitle} application is proof.`,
    `This resume is a cut above the rest. Finalizing the details for ${companyName}.`,
    `The best careers are tailor-made. We're designing yours for the ${jobTitle} position at ${companyName}.`,
    `Get ready to impress, ${userName}. Your resume for ${companyName} is almost ready for its debut.`,
    `We're stitching your story into a compelling narrative for the ${jobTitle} role.`,
    `The final fitting is always the most exciting. Your resume for ${companyName} is almost there.`,
    `Let's make sure you're the perfect candidate for ${companyName}. Your resume is in expert hands, ${userName}.`,
    `The details make the design. We're adding the finishing touches to your ${jobTitle} application.`,
    `Your resume is about to be the sharpest in the stack at ${companyName}. We're making sure of it, ${userName}.`,
    `A tailor-made resume for a tailor-made career. Your ${jobTitle} application is our canvas.`,
    `We're not just making resumes, we're making statements. Yours for ${companyName} will be unforgettable.`,
    `The perfect fit for the perfect job. Your ${jobTitle} application is getting the royal treatment.`,
    `Let's get you noticed, ${userName}. Your resume for ${companyName} is designed to turn heads.`,
    `The best tailors work with the best materials. Your skills are the fabric of this masterpiece for the ${jobTitle} role.`,
    `We're creating a look that's both timeless and modern for your application to ${companyName}.`,
    `Your resume is our masterpiece, ${userName}. We're making sure it's ready for the ${jobTitle} role at ${companyName}.`,
    `The perfect resume is a work of art. Yours for ${companyName} is about to be unveiled.`,
    `We're not just building resumes, we're building futures. Your ${jobTitle} application is a big step.`,
    `Let's make sure your first impression is a lasting one at ${companyName}. Your resume is our mission, ${userName}.`,
    `The best-dressed minds get the best jobs. We're suiting you up for the ${jobTitle} role.`,
    `Your resume is being tailored to perfection for ${companyName}. The results will be stunning, ${userName}.`,
    `We're weaving your experience into a story that ${companyName} won't be able to resist for the ${jobTitle} position.`,
    `The final touches make all the difference. Your resume for ${companyName} is getting the star treatment.`,
    `Let's make sure you're ready for the spotlight at ${companyName}. Your resume is our masterpiece, ${userName}.`,
    `The perfect resume is a key that unlocks doors. We're forging yours for the ${jobTitle} role at ${companyName}.`,
    `We're not just tailoring resumes, we're tailoring destinies. Your application for ${companyName} is in the works.`,
    `Get ready for a standing ovation, ${userName}. Your resume for the ${jobTitle} role at ${companyName} is a showstopper.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
};