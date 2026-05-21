import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { verifyToken } from "@/lib/auth";

async function checkAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "Admin") {
    return null;
  }
  return decoded;
}

// Helper to safely parse dates from Excel
const parseExcelDate = (value: any) => {
  if (!value) return null;
  if (typeof value === "number") {
    // Excel date serial number
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  const dateStr = String(value).trim();
  const standardDate = new Date(dateStr);
  if (!isNaN(standardDate.getTime())) {
    return standardDate;
  }

  // Handle DD/MM/YYYY format manual parsing
  const ukDatePattern = /^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/;
  const match = dateStr.match(ukDatePattern);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid file format. Please upload a valid Excel file." },
        { status: 400 }
      );
    }

    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    const toSafeString = (value: any) =>
      value === undefined || value === null ? "" : String(value).trim();
      
    const normalizeKey = (key: string) =>
      key
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s._-]+/g, "");

    const parseArray = (str: string) => {
      if (!str) return [];
      return str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const mappedData = jsonData
      .map((row: any) => {
        const normalizedRow = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [normalizeKey(k), v])
        );

        const getUserId = () =>
          normalizedRow["userid"] ||
          normalizedRow["id"] ||
          normalizedRow["user_id"] ||
          normalizedRow["employeeid"] ||
          normalizedRow["empid"];
          
        const getUserName = () =>
          normalizedRow["username"] ||
          normalizedRow["name"] ||
          normalizedRow["user_name"] ||
          normalizedRow["teachername"] ||
          normalizedRow["fullname"];

        const getJoiningDate = () =>
          normalizedRow["joiningdate"] ||
          normalizedRow["dateofjoining"] ||
          normalizedRow["doj"] ||
          normalizedRow["joining"];

        const getBranch = () =>
          normalizedRow["branch"] ||
          normalizedRow["school"] ||
          normalizedRow["campus"] ||
          normalizedRow["location"];

        const getDesignation = () =>
          normalizedRow["designation"] ||
          normalizedRow["role"] ||
          normalizedRow["position"] ||
          normalizedRow["title"];

        const getSubjects = () =>
          normalizedRow["subjects"] || normalizedRow["subject"];

        const getQualifications = () =>
          normalizedRow["qualifications"] || normalizedRow["qualification"] || normalizedRow["degree"];

        const getGrades = () =>
          normalizedRow["gradesincharge"] ||
          normalizedRow["grades"] ||
          normalizedRow["classes"] ||
          normalizedRow["classincharge"];

        const getExperience = () =>
          normalizedRow["experience"] || normalizedRow["exp"] || normalizedRow["years"];

        // Extract joining date key for custom parsing
        const rawJoiningDateKey = Object.keys(row).find((k) =>
          normalizeKey(k).includes("joining") || normalizeKey(k).includes("doj")
        );
        const joiningDate = rawJoiningDateKey ? parseExcelDate(row[rawJoiningDateKey]) : new Date();

        return {
          userId: toSafeString(getUserId()),
          userName: toSafeString(getUserName()),
          joiningDate: joiningDate || new Date(),
          branch: toSafeString(getBranch()),
          designation: toSafeString(getDesignation()),
          subjects: parseArray(toSafeString(getSubjects())),
          qualifications: toSafeString(getQualifications()),
          gradesInCharge: parseArray(toSafeString(getGrades())),
          experience: toSafeString(getExperience()),
          email: toSafeString(normalizedRow["email"]),
          mobileNo: toSafeString(normalizedRow["mobile"] || normalizedRow["mobileno"] || normalizedRow["phone"]),
        };
      })
      .filter((t: any) => t.userId && t.userName && t.branch && t.designation);

    if (mappedData.length === 0) {
      return NextResponse.json(
        {
          message:
            "No valid teacher data found. Required columns: User ID, User Name, Joining Date, Branch, Designation.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "File parsed successfully",
      data: mappedData,
      count: mappedData.length,
    });
  } catch (error: any) {
    console.error("Error uploading teacher file:", error);
    return NextResponse.json(
      { message: "Error processing file: " + error.message },
      { status: 500 }
    );
  }
}
