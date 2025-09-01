import {
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Notification,
  NotificationProps,
  Progress,
  Stack,
  TagsInput,
  Text,
  Title,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { BillData, BillResponse, ImageStatus } from './dto.ts';

const USCurrency = Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
});

type ImageStatusNotificationProps = {
  analyzeProgress: number;
  imageStatus: ImageStatus;
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

  useEffect(() => {
    // No need to refetch the bill if it's done parsing
    if (props.bill.imageStatus !== 'parsing') {
      return;
    }

    const fetchBill = async () => {
      setAnalyzeProgress((prev) => (prev < 100 ? prev + 5 : prev));

      try {
        const res = await fetch(`/api/bills/${bill.id}`);
        const { data } = BillResponse.parse(await res.json());
        if (data.imageStatus === 'parsing') {
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
  }, [props.bill.imageStatus]);

  const handleOnChangeParticipant = (newParticipants: string[]) => {
    setUpdatingParticipants(() => true);
    setTimeout(() => {
      setParticipants(() => newParticipants);
      setUpdatingParticipants(() => false);
    }, 750);
  };

  const subTotal = bill.lineItems?.reduce(
    (total, item) => item.price + total,
    0,
  );

  const total = (subTotal ?? 0) + (bill.gratuity ?? 0) + (bill.tax ?? 0);

  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Here is your bill!
      </Title>
      <Center mb="xl">
        <img
          width="auto"
          height="300px"
          src={bill.imagePath}
          alt="bill image"
        />
      </Center>
      {/* Only show image status notification if it's not initially ready */}
      {props.bill.imageStatus !== 'ready' && (
        <ImageStatusNotification
          analyzeProgress={analyzeProgress}
          imageStatus={bill.imageStatus}
        />
      )}
      <Stack gap="xs" mb="xl">
        <Group gap="md" justify="space-between">
          <Text>Subtotal:</Text>
          <Text>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(subTotal ?? 0)
              : 'Pending'}
          </Text>
        </Group>
        <Group gap="md" justify="space-between">
          <Text>Tax:</Text>
          <Text>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(bill.tax ?? 0)
              : 'Pending'}
          </Text>
        </Group>
        <Group gap="md" justify="space-between">
          <Text>Gratuity:</Text>
          <Text>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(bill.gratuity ?? 0)
              : 'Pending'}
          </Text>
        </Group>
        <Divider />
        <Group gap="md" justify="space-between">
          <Text size="xl" component={'b'} fw={'bolder'}>
            Total:
          </Text>
          <Text size="xl" component={'b'} fw={'bolder'}>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(total)
              : 'Pending'}
          </Text>
        </Group>
      </Stack>
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
    </Container>
  );
};
