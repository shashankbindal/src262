'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const connectDB = require('../config/db');
const Event     = require('../models/Event');
const logger    = require('../utils/logger');

const events = [
  {
    name:                 'Chem-E-Jeopardy',
    slug:                 'chem-e-jeopardy',
    description:          'Chemical Engineering trivia competition testing theoretical knowledge.',
    type:                 'team',
    registrationDeadline: new Date('2026-08-10T23:59:59Z'),
    fileUploadRequired:   false,
    minTeamSize:          2,
    maxTeamSize:          4,
    registrationEnabled:  true,
    whatsappGroupLink:    'https://chat.whatsapp.com/dummy-jeopardy',
  },
  {
    name:                 'Chem-E-Car',
    slug:                 'chem-e-car',
    description:          'Design and build a car powered by a chemical energy source.',
    type:                 'team',
    registrationDeadline: new Date('2026-08-05T23:59:59Z'),
    submissionDeadline:   new Date('2026-08-20T23:59:59Z'),
    fileUploadRequired:   true,
    allowedFileTypes:     ['application/pdf'],
    maxFileSizeMB:        15,
    minTeamSize:          2,
    maxTeamSize:          6,
    registrationEnabled:  true,
    whatsappGroupLink:    'https://chat.whatsapp.com/dummy-car',
  },
  {
    name:                 'Poster Presentation',
    slug:                 'poster-presentation',
    description:          'Present your research through a visual poster.',
    type:                 'solo',
    registrationDeadline: new Date('2026-08-10T23:59:59Z'),
    submissionDeadline:   new Date('2026-08-18T23:59:59Z'),
    fileUploadRequired:   true,
    allowedFileTypes:     ['application/pdf'],
    maxFileSizeMB:        10,
    registrationEnabled:  true,
    whatsappGroupLink:    'https://chat.whatsapp.com/dummy-poster',
  },
  {
    name:                 'Paper Presentation',
    slug:                 'paper-presentation',
    description:          'Present your technical paper on emerging trends in chemical engineering.',
    type:                 'solo',
    registrationDeadline: new Date('2026-08-10T23:59:59Z'),
    submissionDeadline:   new Date('2026-08-15T23:59:59Z'),
    fileUploadRequired:   true,
    allowedFileTypes:     ['application/pdf'],
    maxFileSizeMB:        10,
    registrationEnabled:  true,
    whatsappGroupLink:    'https://chat.whatsapp.com/dummy-paper',
  },
  {
    name:                 'K-12 STEM',
    slug:                 'k12-stem',
    description:          'Outreach event inspiring school students with STEM activities.',
    type:                 'team',
    registrationDeadline: new Date('2026-08-12T23:59:59Z'),
    fileUploadRequired:   false,
    minTeamSize:          2,
    maxTeamSize:          5,
    registrationEnabled:  true,
    whatsappGroupLink:    'https://chat.whatsapp.com/dummy-k12',
  },
];

(async () => {
  try {
    await connectDB();
    for (const evt of events) {
      await Event.findOneAndUpdate(
        { slug: evt.slug },
        { $set: evt },
        { upsert: true, new: true, runValidators: true }
      );
      logger.info(`Seeded: ${evt.name}`);
    }
    logger.info('All events seeded successfully');
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    process.exit(1);
  }
})();
