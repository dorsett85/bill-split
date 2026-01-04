import { Affix, Box, Button, Transition } from '@mantine/core';
import { type ReactElement, useEffect, useRef, useState } from 'react';

type ViewType = 'participant' | 'lineItem';

interface BillViewSelectProps {
  defaultView?: ViewType;
  participantView: ReactElement;
  lineItemView: ReactElement;
}

export const BillViewSelect = ({
  defaultView = 'participant',
  participantView,
  lineItemView,
}: BillViewSelectProps) => {
  const [view, setView] = useState<ViewType>(defaultView);
  const [opened, setOpened] = useState(false);
  const intersectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!intersectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setOpened(entry.isIntersecting);
      },
      {
        rootMargin: '-100px',
      },
    );

    observer.observe(intersectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={intersectionRef}>
      {view === 'participant' ? participantView : lineItemView}
      <Affix position={{ bottom: 10, right: 10 }}>
        <Transition transition="slide-up" mounted={opened} duration={400}>
          {(transitionStyles) => (
            <Button
              onClick={() =>
                setView((prev) =>
                  prev === 'participant' ? 'lineItem' : 'participant',
                )
              }
              style={transitionStyles}
              size="lg"
              radius="xl"
            >
              View {view === 'participant' ? 'Line Items' : 'Participants'}
            </Button>
          )}
        </Transition>
      </Affix>
    </Box>
  );
};
