
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, quizId, score, passed, answers } = req.body;

    if (!userId || !quizId || score === undefined || passed === undefined || !answers) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const newAttempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        passed,
        answers: answers as any, // Store answers JSON
        submittedAt: new Date(),
      },
    });

    res.status(201).json(newAttempt);
  } catch (error) {
    console.error('Failed to save quiz attempt:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
