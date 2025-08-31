import {
  Center,
  Container,
  Loader,
  Notification,
  NotificationProps,
  Progress,
  TagsInput,
  Title,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { BillData } from './types.ts';

type ImageStatusNotificationProps = {
  analyzeProgress: number;
  imageStatus: BillData['image_status'];
};

const ImageStatusNotification: React.FC<ImageStatusNotificationProps> = ({
  analyzeProgress,
  imageStatus,
}) => {
  const notificationProps: Pick<
    NotificationProps,
    'children' | 'color' | 'title'
  > = (() => {
    switch (imageStatus) {
      case 'parsing':
        return {
          children: (
            <Progress
              animated
              value={analyzeProgress}
              m="md"
              size="md"
              color={'yellow'}
              transitionDuration={250}
            />
          ),
          color: 'yellow',
          title:
            "We're still analyzing your bill. You can add participants in the meantime below!",
        };
      case 'error':
        return {
          children: (
            <>
              Click <a href="/">here</a> to try again
            </>
          ),
          color: 'red',
          title: 'Something went wrong analyzing your bill',
        };
      case 'ready':
        return {
          children: <>Add participants and assign bill items below</>,
          color: 'green',
          title: 'Your bill has been successfully analyzed!',
        };
    }
  })();

  return (
    <Notification {...notificationProps} mb="xl" withCloseButton={false} />
  );
};

interface BillProps {
  bill: BillData;
}

export const Bill: React.FC<BillProps> = (props) => {
  const [bill, setBill] = useState<BillData>(props.bill);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [updatingParticipants, setUpdatingParticipants] = useState(false);

  console.log();

  useEffect(() => {
    // No need to refetch the bill if it's done parsing
    if (props.bill.image_status !== 'parsing') {
      return;
    }

    const fetchBill = async () => {
      setAnalyzeProgress((prev) => (prev < 100 ? prev + 5 : prev));

      try {
        const res = await fetch(`/api/bills/${bill.id}`);
        const { data }: { data: BillData } = await res.json();
        if (data.image_status === 'parsing') {
          // Refetch if it's still parsing
          return setTimeout(() => fetchBill(), 1000);
        }
        setBill(data);
      } catch {
        // Any fetch errors we can just set the image status to error
        setBill((prev) => ({
          ...prev,
          image_status: 'error',
        }));
      }
    };

    void fetchBill();
  }, [props.bill.image_status]);

  const handleOnChangeParticipant = (newParticipants: string[]) => {
    setUpdatingParticipants(() => true);
    setTimeout(() => {
      setParticipants(() => newParticipants);
      setUpdatingParticipants(() => false);
    }, 750);
  };

  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Here is your bill!
      </Title>
      <Center mb="xl">
        <img
          width="auto"
          height="300px"
          src={bill.image_path}
          alt="bill image"
        />
      </Center>
      {/* Only show image status notification if it's not initially ready */}
      {props.bill.image_status !== 'ready' && (
        <ImageStatusNotification
          analyzeProgress={analyzeProgress}
          imageStatus={bill.image_status}
        />
      )}
      <TagsInput
        disabled={updatingParticipants}
        id="add-participant-input"
        label="Add Participants"
        leftSection={
          updatingParticipants ? (
            <Loader size={'sm'} color={'yellow'} />
          ) : undefined
        }
        placeholder="Enter someone's name"
        mb="xl"
        size="md"
        value={participants}
        onChange={handleOnChangeParticipant}
      />
      <Title order={2}>Subtotal: Pending</Title>
      <Title order={2}>
        Tax: {bill.tax !== undefined ? bill.tax : 'Pending'}
      </Title>
      <Title order={2}>
        Gratuity: {bill.gratuity !== undefined ? bill.gratuity : 'Pending'}
      </Title>
    </Container>
  );
};
