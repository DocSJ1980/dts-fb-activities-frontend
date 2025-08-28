import jsPDF from "jspdf";
import {
  SurveillanceActivity,
  ContainerData,
  User,
} from "@/types/surveillance";

interface PDFData {
  activities: SurveillanceActivity[];
  containerData: ContainerData[];
  users: User[];
  filters: {
    date: string;
    townCode?: string;
    ucCode?: string;
  };
  selectedFieldWorker?: string;
}

interface StatsData {
  housesChecked: number;
  housesPositive: number;
  containersChecked: number;
  containersPositive: number;
}

// Helper function to convert image URL to base64 with better error handling
async function getImageAsBase64(url: string): Promise<string | null> {
  try {
    console.log(`Loading image: ${url.substring(0, 50)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      mode: "cors",
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0 (compatible; PDF-Generator/1.0)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // Validate that it's actually an image
    if (!blob.type.startsWith("image/")) {
      throw new Error(`Invalid content type: ${blob.type}`);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        console.log(`Successfully loaded image: ${url.substring(0, 50)}...`);
        resolve(base64);
      };
      reader.onerror = () => {
        console.log(`FileReader error for: ${url.substring(0, 50)}...`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        `Error loading image ${url.substring(0, 50)}...: ${error.message}`
      );
    } else {
      console.log(`Unknown error loading image: ${url.substring(0, 50)}...`);
    }
    return null;
  }
}

export const generateSurveillancePDF = async (data: PDFData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryColor = "#2563eb"; // blue-600
  const successColor = "#16a34a"; // green-600
  const dangerColor = "#dc2626"; // red-600
  const purpleColor = "#9333ea"; // purple-600
  const grayColor = "#6b7280"; // gray-500

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper function to draw a card-like rectangle
  const drawCard = (
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor?: string
  ) => {
    if (fillColor) {
      doc.setFillColor(fillColor);
      doc.roundedRect(x, y, width, height, 2, 2, "F");
    }
    doc.setDrawColor("#e5e7eb"); // gray-200
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, height, 2, 2, "S");
  };

  // Header
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text("🦟 Indoor Surveillance Report", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 15;

  doc.setFontSize(12);
  doc.setTextColor(grayColor);
  doc.text("District Health Authority Rawalpindi", pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(
    "Powered by Epidemics Prevention & Control Cell",
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 20;

  // Filter Information
  doc.setFontSize(14);
  doc.setTextColor("#000000");
  doc.text("Report Details", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(grayColor);
  doc.text(
    `Date: ${new Date(data.filters.date).toLocaleDateString()}`,
    20,
    yPosition
  );
  yPosition += 5;

  if (data.filters.townCode) {
    // Try to find town name from activities, fallback to code
    const townName =
      data.activities.find((a) => a.Town)?.Town || data.filters.townCode;
    doc.text(`Town: ${townName}`, 20, yPosition);
    yPosition += 5;
  }

  if (data.filters.ucCode) {
    // Try to find UC name from activities, fallback to code
    const ucName = data.activities.find((a) => a.UC)?.UC || data.filters.ucCode;
    doc.text(`UC: ${ucName}`, 20, yPosition);
    yPosition += 5;
  }

  if (data.selectedFieldWorker) {
    const selectedUser = data.users.find(
      (u) => u.username === data.selectedFieldWorker
    );
    doc.text(
      `Field Worker: ${selectedUser?.full_name || data.selectedFieldWorker}`,
      20,
      yPosition
    );
    yPosition += 5;
  }

  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
  yPosition += 20;

  // Calculate statistics (matching web page logic)
  const stats: StatsData = {
    housesChecked: data.activities.length, // Each activity represents a house visit
    housesPositive: data.activities.filter((activity) => {
      const activityContainers = data.containerData.filter(
        (container) => container.Activity_ID === activity.Activity_ID
      );
      return activityContainers.some((container) => container.Positive > 0);
    }).length,
    containersChecked: data.activities.reduce((total, activity) => {
      const activityContainers = data.containerData.filter((container) => {
        return container.Activity_ID === activity.Activity_ID;
      });
      return (
        total +
        activityContainers.reduce(
          (sum, container) => sum + (container.Checked || 0),
          0
        )
      );
    }, 0),
    containersPositive: data.activities.reduce((total, activity) => {
      const activityContainers = data.containerData.filter((container) => {
        return container.Activity_ID === activity.Activity_ID;
      });
      return (
        total +
        activityContainers.reduce(
          (sum, container) => sum + (container.Positive || 0),
          0
        )
      );
    }, 0),
  };

  // Statistics Cards
  checkPageBreak(60);
  doc.setFontSize(14);
  doc.setTextColor("#000000");
  doc.text("Summary Statistics", 20, yPosition);
  yPosition += 15;

  const cardWidth = (pageWidth - 50) / 2;
  const cardHeight = 25;

  // Houses Row
  // Houses Checked Card
  drawCard(20, yPosition, cardWidth, cardHeight, "#f8fafc");
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text(stats.housesChecked.toString(), 20 + cardWidth / 2, yPosition + 10, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setTextColor(grayColor);
  doc.text("Houses Checked", 20 + cardWidth / 2, yPosition + 18, {
    align: "center",
  });

  // Houses Positive Card
  drawCard(30 + cardWidth, yPosition, cardWidth, cardHeight, "#f8fafc");
  doc.setFontSize(16);
  doc.setTextColor(stats.housesPositive > 0 ? dangerColor : successColor);
  doc.text(
    stats.housesPositive.toString(),
    30 + cardWidth + cardWidth / 2,
    yPosition + 10,
    { align: "center" }
  );
  doc.setFontSize(8);
  doc.setTextColor(grayColor);
  doc.text("Houses Positive", 30 + cardWidth + cardWidth / 2, yPosition + 18, {
    align: "center",
  });

  yPosition += cardHeight + 10;

  // Containers Row
  // Containers Checked Card
  drawCard(20, yPosition, cardWidth, cardHeight, "#f8fafc");
  doc.setFontSize(16);
  doc.setTextColor(purpleColor);
  doc.text(
    stats.containersChecked.toString(),
    20 + cardWidth / 2,
    yPosition + 10,
    { align: "center" }
  );
  doc.setFontSize(8);
  doc.setTextColor(grayColor);
  doc.text("Containers Checked", 20 + cardWidth / 2, yPosition + 18, {
    align: "center",
  });

  // Containers Positive Card
  drawCard(30 + cardWidth, yPosition, cardWidth, cardHeight, "#f8fafc");
  doc.setFontSize(16);
  doc.setTextColor(stats.containersPositive > 0 ? dangerColor : successColor);
  doc.text(
    stats.containersPositive.toString(),
    30 + cardWidth + cardWidth / 2,
    yPosition + 10,
    { align: "center" }
  );
  doc.setFontSize(8);
  doc.setTextColor(grayColor);
  doc.text(
    "Containers Positive",
    30 + cardWidth + cardWidth / 2,
    yPosition + 18,
    { align: "center" }
  );

  yPosition += cardHeight + 20;

  // Field Worker Table
  if (data.users.length > 0) {
    checkPageBreak(80);
    doc.setFontSize(14);
    doc.setTextColor("#000000");
    doc.text("Field Worker Performance", 20, yPosition);
    yPosition += 15;

    // Table headers
    const tableStartY = yPosition;
    const colWidths = [60, 30, 30, 30, 30];
    const colPositions = [20, 80, 110, 140, 170];

    // Header background
    doc.setFillColor("#f3f4f6");
    doc.rect(20, yPosition, pageWidth - 40, 12, "F");

    // Header text
    doc.setFontSize(9);
    doc.setTextColor("#374151");
    doc.text("Field Worker", colPositions[0] + 2, yPosition + 8);
    doc.text("Houses", colPositions[1] + 2, yPosition + 8);
    doc.text("Containers", colPositions[2] + 2, yPosition + 8);
    doc.text("Positive", colPositions[3] + 2, yPosition + 8);
    doc.text("Total", colPositions[4] + 2, yPosition + 8);

    yPosition += 12;

    // Table rows
    data.users.forEach((user, index) => {
      if (checkPageBreak(15)) {
        // Redraw headers on new page
        doc.setFillColor("#f3f4f6");
        doc.rect(20, yPosition, pageWidth - 40, 12, "F");
        doc.setFontSize(9);
        doc.setTextColor("#374151");
        doc.text("Field Worker", colPositions[0] + 2, yPosition + 8);
        doc.text("Houses", colPositions[1] + 2, yPosition + 8);
        doc.text("Containers", colPositions[2] + 2, yPosition + 8);
        doc.text("Positive", colPositions[3] + 2, yPosition + 8);
        doc.text("Total", colPositions[4] + 2, yPosition + 8);
        yPosition += 12;
      }

      const userActivities = data.activities.filter(
        (a) => a.Submitted_by === user.username
      );
      const userHouses = userActivities.length; // Each activity is a house visit

      // Calculate user's container stats by linking through activities
      const userContainers = userActivities.reduce((total, activity) => {
        const activityContainers = data.containerData.filter(
          (container) => container.Activity_ID === activity.Activity_ID
        );
        return (
          total +
          activityContainers.reduce(
            (sum, container) => sum + (container.Checked || 0),
            0
          )
        );
      }, 0);

      // Calculate positive houses for this user
      const userPositive = userActivities.filter((activity) => {
        const activityContainers = data.containerData.filter(
          (container) => container.Activity_ID === activity.Activity_ID
        );
        return activityContainers.some((container) => container.Positive > 0);
      }).length;

      const userTotal = userActivities.length;

      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor("#f9fafb");
        doc.rect(20, yPosition, pageWidth - 40, 12, "F");
      }

      // Row data
      doc.setFontSize(8);
      doc.setTextColor("#000000");
      doc.text(
        user.full_name.substring(0, 25),
        colPositions[0] + 2,
        yPosition + 8
      );
      doc.text(userHouses.toString(), colPositions[1] + 2, yPosition + 8);
      doc.text(userContainers.toString(), colPositions[2] + 2, yPosition + 8);

      // Color code positive cases
      doc.setTextColor(userPositive > 0 ? dangerColor : successColor);
      doc.text(userPositive.toString(), colPositions[3] + 2, yPosition + 8);

      doc.setTextColor("#000000");
      doc.text(userTotal.toString(), colPositions[4] + 2, yPosition + 8);

      yPosition += 12;
    });

    // Table border
    doc.setDrawColor("#e5e7eb");
    doc.setLineWidth(0.5);
    doc.rect(20, tableStartY, pageWidth - 40, yPosition - tableStartY);

    yPosition += 10;
  }

  // Surveillance Feed
  if (data.activities.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor("#000000");
    doc.text("Surveillance Feed", 20, yPosition);
    yPosition += 15;

    // Pre-load all images for activities that have them
    const activitiesWithImages = data.activities
      .slice(0, 20)
      .filter((activity) => activity.Picture && activity.Picture.trim() !== "");

    console.log(`📸 Loading ${activitiesWithImages.length} images for PDF...`);

    const imagePromises = activitiesWithImages.map((activity, index) =>
      getImageAsBase64(activity.Picture).then((base64) => {
        console.log(
          `✅ Image ${index + 1}/${activitiesWithImages.length} loaded`
        );
        return {
          activityId: activity.Activity_ID,
          base64,
        };
      })
    );

    const imageResults = await Promise.all(imagePromises);
    const successfulImages = imageResults.filter(
      (result) => result.base64 !== null
    ).length;
    console.log(
      `🎉 Successfully loaded ${successfulImages}/${activitiesWithImages.length} images`
    );

    const imageMap = new Map(
      imageResults.map((result) => [result.activityId, result.base64])
    );

    for (let index = 0; index < Math.min(data.activities.length, 20); index++) {
      const activity = data.activities[index];
      // Limit to first 20 activities for detailed cards
      if (checkPageBreak(80)) {
        doc.setFontSize(14);
        doc.setTextColor("#000000");
        doc.text("Surveillance Feed (continued)", 20, yPosition);
        yPosition += 15;
      }

      // Calculate card height based on content
      const activityContainers = data.containerData.filter(
        (container) => container.Activity_ID === activity.Activity_ID
      );
      const hasContainers = activityContainers.length > 0;
      const hasImage = activity.Picture && activity.Picture.trim() !== "";

      // Dynamic card height: base 95 + containers 40 + image 85 (larger for enhanced quality)
      let cardHeight = 95;
      if (hasContainers) cardHeight += 40;
      if (hasImage) cardHeight += 85;

      // Enhanced main card with professional styling
      doc.setFillColor("#ffffff");
      doc.roundedRect(20, yPosition, pageWidth - 40, cardHeight, 4, 4, "F");

      // Add subtle border with shadow effect
      doc.setDrawColor("#e2e8f0");
      doc.setLineWidth(1);
      doc.roundedRect(20, yPosition, pageWidth - 40, cardHeight, 4, 4, "S");

      // Add top accent bar for visual hierarchy
      doc.setFillColor(primaryColor);
      doc.roundedRect(20, yPosition, pageWidth - 40, 3, 4, 4, "F");

      // Enhanced user avatar with better styling
      doc.setFillColor(primaryColor);
      doc.circle(32, yPosition + 18, 9, "F");

      // Add white border around avatar
      doc.setDrawColor("#ffffff");
      doc.setLineWidth(2);
      doc.circle(32, yPosition + 18, 9, "S");

      doc.setFontSize(11);
      doc.setTextColor("#ffffff");
      const initials = (activity.Submitted_by || "U")
        .substring(0, 1)
        .toUpperCase();
      doc.text(initials, 32, yPosition + 22, { align: "center" });

      // Enhanced user info section
      doc.setFontSize(11);
      doc.setTextColor("#1e293b");
      const userName =
        data.users.find((u) => u.username === activity.Submitted_by)
          ?.full_name ||
        activity.Submitted_by ||
        "Unknown User";
      doc.text(userName.substring(0, 25), 45, yPosition + 16);

      // Better timestamp formatting with icons
      const activityDate = activity.Activity_DateTime
        ? new Date(activity.Activity_DateTime).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          })
        : "N/A";
      const activityTime = activity.Activity_DateTime
        ? new Date(activity.Activity_DateTime).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A";

      doc.setFontSize(8);
      doc.setTextColor("#64748b");
      doc.text(`📅 ${activityDate} • ⏰ ${activityTime}`, 45, yPosition + 24);

      // Enhanced location section with better hierarchy
      doc.setFontSize(10);
      doc.setTextColor("#374151");
      doc.text(
        `👤 ${activity.Name_of_Family_Head || "Unknown Family"}`,
        25,
        yPosition + 38
      );

      doc.setFontSize(9);
      doc.setTextColor("#6b7280");
      doc.text(`🏠 ${activity.Address || "No Address"}`, 25, yPosition + 46);

      doc.setFontSize(8);
      doc.setTextColor("#9ca3af");
      doc.text(
        `📍 ${activity.Town || "Unknown Town"}, ${activity.UC || "Unknown UC"}`,
        25,
        yPosition + 54
      );

      // Enhanced status badges with professional styling
      const isPositive =
        activity.Tag?.toLowerCase().includes("positive") || false;
      const statusColor = isPositive ? dangerColor : successColor;
      const statusBg = isPositive ? "#fef2f2" : "#f0fdf4";
      const statusBorder = isPositive ? "#fecaca" : "#bbf7d0";

      // Main status badge with border
      doc.setFillColor(statusBg);
      doc.roundedRect(25, yPosition + 62, 45, 14, 3, 3, "F");
      doc.setDrawColor(statusBorder);
      doc.setLineWidth(1);
      doc.roundedRect(25, yPosition + 62, 45, 14, 3, 3, "S");

      // Status icon and text
      doc.setFontSize(8);
      doc.setTextColor(statusColor);
      const statusIcon = isPositive ? "⚠️" : "✅";
      const statusText = (activity.Tag || "N/A").toUpperCase();
      doc.text(`${statusIcon} ${statusText}`, 27, yPosition + 71);

      // Activity type badge
      doc.setFillColor("#f8fafc");
      doc.roundedRect(75, yPosition + 62, 50, 14, 3, 3, "F");
      doc.setDrawColor("#e2e8f0");
      doc.setLineWidth(0.5);
      doc.roundedRect(75, yPosition + 62, 50, 14, 3, 3, "S");

      doc.setFontSize(7);
      doc.setTextColor("#475569");
      doc.text("🔍 SURVEILLANCE", 77, yPosition + 71);

      let currentY = yPosition + 85; // Start after enhanced status badges

      // Enhanced Container data section (if available)
      if (hasContainers) {
        const containersChecked = activityContainers.reduce(
          (sum, container) => sum + (container.Checked || 0),
          0
        );
        const containersPositive = activityContainers.reduce(
          (sum, container) => sum + (container.Positive || 0),
          0
        );

        // Professional container summary section
        doc.setFillColor("#f8fafc");
        doc.roundedRect(25, currentY, pageWidth - 50, 32, 4, 4, "F");

        // Add gradient-like border effect
        doc.setDrawColor("#cbd5e1");
        doc.setLineWidth(1);
        doc.roundedRect(25, currentY, pageWidth - 50, 32, 4, 4, "S");

        // Add inner highlight
        doc.setDrawColor("#f1f5f9");
        doc.setLineWidth(0.5);
        doc.roundedRect(26, currentY + 1, pageWidth - 52, 30, 3, 3, "S");

        // Container title with enhanced styling
        doc.setFontSize(10);
        doc.setTextColor("#1e293b");
        doc.text("📦 Container Inspection Results", 30, currentY + 12);

        // Enhanced stats with icons and better layout
        doc.setFontSize(9);
        doc.setTextColor(primaryColor);
        doc.text(`🔍 Checked: ${containersChecked}`, 30, currentY + 20);

        doc.setTextColor(containersPositive > 0 ? dangerColor : successColor);
        const positiveIcon = containersPositive > 0 ? "⚠️" : "✅";
        doc.text(
          `${positiveIcon} Positive: ${containersPositive}`,
          30,
          currentY + 27
        );

        // Enhanced container type breakdown with professional styling
        const containerTypes = activityContainers.reduce((acc, container) => {
          const type = container.Container_Tag || "Unknown";
          if (!acc[type]) {
            acc[type] = { checked: 0, positive: 0 };
          }
          acc[type].checked += container.Checked || 0;
          acc[type].positive += container.Positive || 0;
          return acc;
        }, {} as Record<string, { checked: number; positive: number }>);

        // Right side breakdown with better visual hierarchy
        let typeX = pageWidth - 120;
        let typeY = currentY + 10;

        // Add breakdown header
        doc.setFontSize(8);
        doc.setTextColor("#64748b");
        doc.text("Container Types:", typeX, typeY);
        typeY += 8;

        Object.entries(containerTypes)
          .slice(0, 3)
          .forEach(([type, stats]) => {
            // Container type with icon
            doc.setFontSize(7);
            doc.setTextColor("#475569");
            const shortType =
              type.length > 10 ? type.substring(0, 10) + "..." : type;
            doc.text(`• ${shortType}`, typeX, typeY);

            // Stats with better formatting
            doc.setTextColor(primaryColor);
            doc.text(`${stats.checked}`, typeX + 35, typeY);

            if (stats.positive > 0) {
              doc.setTextColor(dangerColor);
              doc.text(`(+${stats.positive})`, typeX + 45, typeY);
            }

            typeY += 5;
          });

        currentY += 37;
      }

      // Enhanced Image section with professional presentation
      if (hasImage) {
        const imageWidth = 140; // Even larger for better quality
        const imageHeight = 65;
        const imageX = 25;
        const imageY = currentY;

        // Get pre-loaded image from map
        const base64Image = imageMap.get(activity.Activity_ID);

        if (base64Image) {
          // Create professional image container with multiple borders
          doc.setFillColor("#ffffff");
          doc.roundedRect(
            imageX - 3,
            imageY - 3,
            imageWidth + 6,
            imageHeight + 6,
            4,
            4,
            "F"
          );

          // Outer border (shadow effect)
          doc.setDrawColor("#cbd5e1");
          doc.setLineWidth(1.5);
          doc.roundedRect(
            imageX - 3,
            imageY - 3,
            imageWidth + 6,
            imageHeight + 6,
            4,
            4,
            "S"
          );

          // Inner border (frame effect)
          doc.setDrawColor("#e2e8f0");
          doc.setLineWidth(1);
          doc.roundedRect(
            imageX - 1,
            imageY - 1,
            imageWidth + 2,
            imageHeight + 2,
            2,
            2,
            "S"
          );

          // Successfully loaded image - embed with highest quality!
          doc.addImage(
            base64Image,
            "JPEG",
            imageX,
            imageY,
            imageWidth,
            imageHeight,
            undefined,
            "SLOW" // Highest quality
          );

          // Professional image caption with enhanced styling
          doc.setFontSize(9);
          doc.setTextColor("#374151");
          doc.text(
            "📷 Field Activity Photo",
            imageX,
            imageY + imageHeight + 12
          );

          // Enhanced timestamp with better formatting
          const timestamp = activity.Activity_DateTime
            ? new Date(activity.Activity_DateTime).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unknown time";
          doc.setFontSize(7);
          doc.setTextColor("#64748b");
          doc.text(
            `📅 Captured: ${timestamp}`,
            imageX,
            imageY + imageHeight + 18
          );

          // Add image quality indicator
          doc.setFontSize(6);
          doc.setTextColor("#9ca3af");
          doc.text(
            "✨ High Quality Image",
            imageX + imageWidth - 40,
            imageY + imageHeight + 18
          );
        } else {
          // Professional fallback with enhanced error presentation
          doc.setFillColor("#fef2f2");
          doc.roundedRect(
            imageX - 3,
            imageY - 3,
            imageWidth + 6,
            imageHeight + 6,
            4,
            4,
            "F"
          );

          doc.setDrawColor("#fca5a5");
          doc.setLineWidth(1.5);
          doc.roundedRect(
            imageX - 3,
            imageY - 3,
            imageWidth + 6,
            imageHeight + 6,
            4,
            4,
            "S"
          );

          // Inner error container
          doc.setFillColor("#ffffff");
          doc.roundedRect(imageX, imageY, imageWidth, imageHeight, 3, 3, "F");
          doc.setDrawColor("#fecaca");
          doc.setLineWidth(1);
          doc.roundedRect(imageX, imageY, imageWidth, imageHeight, 3, 3, "S");

          // Enhanced placeholder content
          doc.setFontSize(11);
          doc.setTextColor("#374151");
          doc.text("📷 Activity Photo", imageX + 15, imageY + 20);

          doc.setFontSize(9);
          doc.setTextColor(dangerColor);
          doc.text("⚠️ Image Loading Failed", imageX + 15, imageY + 32);

          doc.setFontSize(7);
          doc.setTextColor("#6b7280");
          doc.text("Common issues:", imageX + 15, imageY + 42);
          doc.text("• Network connectivity problems", imageX + 17, imageY + 48);
          doc.text(
            "• Image server temporarily unavailable",
            imageX + 17,
            imageY + 52
          );
          doc.text("• CORS policy restrictions", imageX + 17, imageY + 56);

          // Add retry suggestion
          doc.setFontSize(6);
          doc.setTextColor("#9ca3af");
          doc.text("💡 Try regenerating the PDF", imageX + 15, imageY + 62);
        }

        currentY += imageHeight + 25; // More space after enhanced image section
      }

      yPosition = currentY + 10;

      // Add subtle separator line between activity cards
      if (index < Math.min(data.activities.length, 20) - 1) {
        doc.setDrawColor("#f1f5f9");
        doc.setLineWidth(0.5);
        doc.line(30, yPosition, pageWidth - 30, yPosition);
        yPosition += 5;
      }
    }

    if (data.activities.length > 20) {
      doc.setFontSize(8);
      doc.setTextColor(grayColor);
      doc.text(
        `... and ${data.activities.length - 20} more activities`,
        25,
        yPosition
      );
      yPosition += 10;
    }
  }

  // Summary note
  if (data.containerData.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(10);
    doc.setTextColor(grayColor);
    doc.text(
      `Note: Container inspection details are integrated within each activity card above.`,
      20,
      yPosition
    );
    doc.text(
      `Total container inspections: ${data.containerData.reduce(
        (sum, c) => sum + (c.Checked || 0),
        0
      )}`,
      20,
      yPosition + 8
    );
    yPosition += 20;
  }

  // Enhanced Footer with generation summary
  yPosition = pageHeight - 40;
  doc.setFontSize(8);
  doc.setTextColor(grayColor);

  // Generation info
  const generationTime = new Date().toLocaleString();
  const totalPages = doc.internal.getNumberOfPages();
  doc.text(`Generated: ${generationTime}`, 20, yPosition);
  doc.text(`Pages: ${totalPages}`, 20, yPosition + 6);

  // Data summary
  const totalImages = data.activities.filter(
    (a) => a.Picture && a.Picture.trim() !== ""
  ).length;
  const totalContainers = data.containerData.reduce(
    (sum, c) => sum + (c.Checked || 0),
    0
  );
  doc.text(
    `Activities: ${data.activities.length} | Images: ${totalImages} | Containers: ${totalContainers}`,
    20,
    yPosition + 12
  );

  // Official footer
  doc.text(
    "This report was generated automatically by the Indoor Surveillance System",
    pageWidth / 2,
    yPosition + 20,
    { align: "center" }
  );
  doc.text(
    "District Health Authority Rawalpindi - Epidemics Prevention & Control Cell",
    pageWidth / 2,
    yPosition + 25,
    { align: "center" }
  );

  // Confidentiality notice
  doc.setTextColor("#dc2626");
  doc.text("⚠️ CONFIDENTIAL", pageWidth - 50, yPosition);
  doc.setTextColor(grayColor);
  doc.text("Authorized Personnel Only", pageWidth - 70, yPosition + 6);

  console.log(
    `📄 PDF generated successfully with ${totalPages} pages, ${data.activities.length} activities, and ${totalImages} images`
  );

  return doc;
};
