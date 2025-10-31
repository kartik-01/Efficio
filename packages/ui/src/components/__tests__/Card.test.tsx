import { render, screen } from '@testing-library/react';
import { Card } from '@efficio/ui';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="Card Title">Content</Card>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Card description="Card description">Content</Card>);
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('renders title and description together', () => {
    render(
      <Card title="Title" description="Description">
        Content
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <Card actions={<button>Action</button>}>Content</Card>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    const card = container.querySelector('.custom-card');
    expect(card).toBeInTheDocument();
  });

  it('does not render header section when title, description, and actions are not provided', () => {
    const { container } = render(<Card>Content</Card>);
    const header = container.querySelector('.pb-4');
    expect(header).not.toBeInTheDocument();
  });
});

