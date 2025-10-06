
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CreateTaskDialog } from '../CreateTaskDialog';

// Mock the API calls and other external dependencies
jest.mock('@/lib/api', () => ({
  createTask: jest.fn(),
  getCategories: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('CreateTaskDialog', () => {
  it('should render the dialog trigger button', () => {
    render(<CreateTaskDialog onTaskCreated={() => {}} />);
    
    const triggerButton = screen.getByRole('button', { name: /নতুন টাস্ক যোগ করুন/i });
    expect(triggerButton).toBeInTheDocument();
  });
});
