from PIL import Image

def remove_background(input_path, output_path, tolerance=50):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    # Let's assume background is white or black.
    # We will check the top-left pixel to guess the background color.
    bg_color = datas[0] 
    
    for item in datas:
        # Check distance to bg_color
        if abs(item[0]-bg_color[0]) < tolerance and abs(item[1]-bg_color[1]) < tolerance and abs(item[2]-bg_color[2]) < tolerance:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_background("public/uploads/PhoneSpot.jpeg", "public/uploads/PhoneSpot.png", 50)
print("Saved PhoneSpot.png")
